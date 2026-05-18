FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Services/JobSearch/JobSearch.API/JobSearch.API.csproj", "src/Services/JobSearch/JobSearch.API/"]
RUN dotnet restore "./src/Services/JobSearch/JobSearch.API/JobSearch.API.csproj"
COPY . .
WORKDIR "/src/src/Services/JobSearch/JobSearch.API"
RUN dotnet build "./JobSearch.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./JobSearch.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "JobSearch.API.dll"]
