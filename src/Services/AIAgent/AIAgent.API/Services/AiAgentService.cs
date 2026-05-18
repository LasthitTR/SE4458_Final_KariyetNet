using AIAgent.API.Models;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;

namespace AIAgent.API.Services
{
    public class AiAgentService : IAiAgentService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AiAgentService> _logger;

        public AiAgentService(HttpClient httpClient, IConfiguration configuration, ILogger<AiAgentService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> ProcessUserMessageAsync(string message, string? userId)
        {
            try
            {
                _logger.LogInformation("Hugging Face Entegrasyonu Çalışıyor. Girdi: {Message}", message);

                var cleanMessage = message.Trim().ToLower(new System.Globalization.CultureInfo("tr-TR"));

                // 1. Genel sohbet kontrolü (Arama niyeti yoksa doğrudan sohbet cevabı ver)
                if (cleanMessage == "selam" || cleanMessage == "merhaba" || cleanMessage == "nasılsın" || cleanMessage.StartsWith("hey") || cleanMessage == "naber")
                {
                    var chatSystemPrompt = "Sen bir kariyer asistanısın. Kullanıcıya samimi, profesyonel ve kısa bir Türkçe karşılama mesajı yaz. Ona nasıl yardımcı olabileceğini sor. (Örn: İstanbul'da yazılım ilanlarını bulabilirim)";
                    return await CallHuggingFaceApiAsync(chatSystemPrompt, message);
                }

                // 2. Arama Parametrelerini Çıkar (City & Position)
                var extractionSystemPrompt = "Sen bir kariyer asistanısın. Kullanıcının cümlesinden SADECE 'City' ve 'Position' bilgilerini yakala. Eğer bulamazsan 'null' döndür. SADECE JSON formatında cevap ver. Örnek format: { \"City\": \"İzmir\", \"Position\": \"Yazılım\" }";
                
                var extractionResultStr = await CallHuggingFaceApiAsync(extractionSystemPrompt, message);
                _logger.LogInformation("Parametre Çıkarım Sonucu: {Result}", extractionResultStr);

                // JSON temizliği (kod blokları ve gereksiz boşluklar temizlenir)
                extractionResultStr = extractionResultStr.Replace("```json", "").Replace("```", "").Trim();

                string? city = null;
                string? position = null;

                try
                {
                    using var doc = JsonDocument.Parse(extractionResultStr);
                    var root = doc.RootElement;
                    
                    if (root.TryGetProperty("City", out var cityProp) && cityProp.ValueKind != JsonValueKind.Null)
                    {
                        var val = cityProp.GetString();
                        if (val != "null" && !string.IsNullOrWhiteSpace(val)) city = val;
                    }
                    if (root.TryGetProperty("Position", out var posProp) && posProp.ValueKind != JsonValueKind.Null)
                    {
                        var val = posProp.GetString();
                        if (val != "null" && !string.IsNullOrWhiteSpace(val)) position = val;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("JSON Ayrıştırma Hatası. Fallback uygulanıyor. Error: {Error}", ex.Message);
                    
                    // Fallback: Basit lokal NLP (Hugging Face geçici hataları için)
                    if (cleanMessage.Contains("izmir")) city = "İzmir";
                    else if (cleanMessage.Contains("istanbul")) city = "İstanbul";
                    else if (cleanMessage.Contains("ankara")) city = "Ankara";

                    if (cleanMessage.Contains("yazılım") || cleanMessage.Contains("mühendis") || cleanMessage.Contains("developer")) position = "yazılım";
                    else if (cleanMessage.Contains("siber") || cleanMessage.Contains("güvenlik")) position = "siber";
                }

                // Eğer hiçbir arama parametresi yakalanamadıysa kullanıcıyı kibarca yönlendir
                if (string.IsNullOrEmpty(city) && string.IsNullOrEmpty(position))
                {
                    return "Merhaba! Seni tam olarak anlayamadım. 🔍 Bana aradığın pozisyonu ve şehri yazarsan (Örneğin: *'İstanbul'da yazılım işi'* veya *'İzmir siber güvenlik'*) hemen bulabilirim! Sana nasıl yardımcı olayım?";
                }

                _logger.LogInformation("Veritabanı Arama Kriterleri -> City: {City}, Position: {Position}", city, position);

                // 3. API Gateway üzerinden JobSearch.API (MongoDB) servisine GET isteği at
                var gatewayUrl = _configuration["ApiGatewayUrl"] ?? "http://localhost:5000";
                var queryParams = new List<string>();
                
                if (!string.IsNullOrEmpty(position)) queryParams.Add($"position={Uri.EscapeDataString(position)}");
                if (!string.IsNullOrEmpty(city)) queryParams.Add($"city={Uri.EscapeDataString(city)}");
                if (!string.IsNullOrEmpty(userId)) queryParams.Add($"userId={Uri.EscapeDataString(userId)}");

                var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
                var searchUrl = $"{gatewayUrl}/api/v1/jobsearch/search{queryString}";

                _logger.LogInformation("JobSearch API Çağrısı: {Url}", searchUrl);
                
                var searchResponse = await _httpClient.GetAsync(searchUrl);
                var searchResultJson = await searchResponse.Content.ReadAsStringAsync();
                
                var jobs = JsonSerializer.Deserialize<List<JobPostingDto>>(searchResultJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

                // 4. İlanları Programatik Olarak Oluştur (Sıfır Halüsinasyon, %100 Gerçek Veri & Linkler)
                if (jobs.Any())
                {
                    var sb = new StringBuilder();
                    sb.AppendLine($"Harika! Senin için aradığın kriterlerde **{jobs.Count} adet** güncel ilan buldum: 🎉\n");

                    foreach (var job in jobs.Take(5))
                    {
                        // Kesinlikle gerçek veritabanı ID'leri kullanılarak link oluşturulur
                        sb.AppendLine($"* 💼 **[{job.Title}](/job/{job.Id})** - {job.CompanyName}");
                        sb.AppendLine($"  📍 {job.City} {(string.IsNullOrEmpty(job.Town) ? "" : $"/ {job.Town}")} | ⏰ *{job.WorkingPreference} - {job.WorkingType}*");
                        sb.AppendLine();
                    }

                    if (jobs.Count > 5)
                    {
                        sb.AppendLine($"*... ve {jobs.Count - 5} ilan daha var! Hepsini listelemek için arama çubuğunu kullanabilirsin.*");
                    }
                    
                    sb.AppendLine("\nDetayları görmek ve hemen başvurmak için yukarıdaki **mavi başlıkların üzerine tıklayabilirsin.** Başka bir pozisyon veya şehir arayalım mı? 😊");
                    return sb.ToString();
                }
                else
                {
                    // Arama sonucunda ilan bulunamadıysa kibarca belirt
                    var criteriaStr = "";
                    if (!string.IsNullOrEmpty(position)) criteriaStr += $"Pozisyon: *'{position}'*";
                    if (!string.IsNullOrEmpty(city)) criteriaStr += (criteriaStr != "" ? ", " : "") + $"Şehir: *'{city}'*";

                    return $"Aradığın kriterlere ({criteriaStr}) uygun aktif bir ilan şu anda veritabanımızda bulunmamaktadır. 😔\n\nYeni ilanlar eklendiğinde sana haber verebilirim. Farklı bir pozisyon (örn: 'Yazılım') veya şehir yazarak aramayı tazeleyebilirsin! 👇";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AIAgent Hugging Face akışında hata oluştu.");
                return "Üzgünüm, şu anda arama veritabanıma ulaşamadım. Lütfen bağlantını kontrol edip tekrar dene.";
            }
        }

        private async Task<string> CallHuggingFaceApiAsync(string systemMessage, string userMessage)
        {
            var token = _configuration["HF_TOKEN"];
            var baseUrl = "https://router.huggingface.co/v1/chat/completions";

            var requestedModel = "mistralai/Mistral-7B-Instruct-v0.2";
            var fallbackModel = "Qwen/Qwen2.5-7B-Instruct";

            var requestBody = new OpenAiChatRequest
            {
                model = requestedModel,
                messages = new List<OpenAiMessage>
                {
                    new() { role = "system", content = systemMessage },
                    new() { role = "user", content = userMessage }
                },
                temperature = 0.2
            };

            try
            {
                return await SendRequestAsync(baseUrl, token, requestBody);
            }
            catch (Exception ex) when (ex.Message.Contains("model_not_supported") || ex.Message.Contains("400") || ex.Message.Contains("403"))
            {
                _logger.LogWarning("Mistral modeli Hugging Face router tarafından desteklenmedi. Yedek model ({Fallback}) deneniyor. Error: {Error}", fallbackModel, ex.Message);
                
                requestBody.model = fallbackModel;
                return await SendRequestAsync(baseUrl, token, requestBody);
            }
        }

        private async Task<string> SendRequestAsync(string url, string token, OpenAiChatRequest requestBody)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            
            var json = JsonSerializer.Serialize(requestBody);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("HF HTTP Hatası. Status: {Status}, Content: {Content}", response.StatusCode, responseContent);
                throw new Exception($"HF Request Failed: {responseContent}");
            }

            var result = JsonSerializer.Deserialize<OpenAiChatResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return result?.choices?.FirstOrDefault()?.message?.content ?? "";
        }
    }

    // Arama sonuçlarını deserilize etmek için DTO
    public class JobPostingDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
        public string WorkingPreference { get; set; } = string.Empty;
        public string WorkingType { get; set; } = string.Empty;
    }

    // OpenAI Uyumlu (Compatible) DTO'lar
    public class OpenAiChatRequest
    {
        public string model { get; set; } = string.Empty;
        public List<OpenAiMessage> messages { get; set; } = new();
        public double temperature { get; set; } = 0.2;
    }

    public class OpenAiMessage
    {
        public string role { get; set; } = string.Empty;
        public string content { get; set; } = string.Empty;
    }

    public class OpenAiChatResponse
    {
        public List<OpenAiChoice> choices { get; set; } = new();
    }

    public class OpenAiChoice
    {
        public OpenAiMessage message { get; set; } = new();
    }
}
