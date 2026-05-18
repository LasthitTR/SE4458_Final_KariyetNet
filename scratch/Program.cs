using System;
using Npgsql;

class Program
{
    static void Main()
    {
        string connStr = "Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.fkrhtmaogxntleoucaom;Password=21070006213Kariyer;Ssl Mode=Require;Trust Server Certificate=true;";
        using var conn = new NpgsqlConnection(connStr);
        conn.Open();

        using var cmd = new NpgsqlCommand(@"
            INSERT INTO ""JobPostings"" (
                ""Id"", ""Title"", ""CompanyName"", ""City"", ""Town"", ""WorkingPreference"", 
                ""WorkingType"", ""PositionLevel"", ""Department"", ""Description"", 
                ""Experience"", ""EducationLevel"", ""MilitaryStatus"", ""CreatedAt"", ""ApplicationCount""
            ) VALUES (
                @Id, @Title, @CompanyName, @City, @Town, @WorkingPreference, 
                @WorkingType, @PositionLevel, @Department, @Description, 
                @Experience, @EducationLevel, @MilitaryStatus, @CreatedAt, @ApplicationCount
            )", conn);

        cmd.Parameters.AddWithValue("Id", Guid.NewGuid());
        cmd.Parameters.AddWithValue("Title", "Direct Test Job");
        cmd.Parameters.AddWithValue("CompanyName", "Test Company");
        cmd.Parameters.AddWithValue("City", "Istanbul");
        cmd.Parameters.AddWithValue("Town", "Kadikoy");
        cmd.Parameters.AddWithValue("WorkingPreference", "Remote");
        cmd.Parameters.AddWithValue("WorkingType", "FullTime");
        cmd.Parameters.AddWithValue("PositionLevel", "Junior");
        cmd.Parameters.AddWithValue("Department", "IT");
        cmd.Parameters.AddWithValue("Description", "Direct Test desc");
        cmd.Parameters.AddWithValue("Experience", "1 year");
        cmd.Parameters.AddWithValue("EducationLevel", "Bachelor");
        cmd.Parameters.AddWithValue("MilitaryStatus", "Exempt");
        cmd.Parameters.AddWithValue("CreatedAt", DateTime.UtcNow);
        cmd.Parameters.AddWithValue("ApplicationCount", 0);

        cmd.ExecuteNonQuery();
        Console.WriteLine("Inserted JobPosting successfully directly!");
    }
}
