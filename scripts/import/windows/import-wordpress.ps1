# === WORDPRESS IMPORT SCRIPT ===
$ErrorActionPreference = "Continue"

try {
    $oldSite = "https://aimaqaqshamy.kz"
    $newApi = "https://aimak-api-w8ps.onrender.com"

    Write-Host "`n=== IMPORTING ARTICLES ===" -ForegroundColor Cyan

    # Wake up API
    Write-Host "Waking up API..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "$newApi/api/health" -TimeoutSec 60 -UseBasicParsing | Out-Null
        Write-Host "API ready!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to wake API" -ForegroundColor Red
        throw
    }

    # Login
    Write-Host "Logging in..." -ForegroundColor Yellow
    $login = @{ email = "admin@aimakakshamy.kz"; password = "admin123" } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$newApi/api/auth/login" -Method POST -Body $login -ContentType "application/json"
    Write-Host "Logged in successfully" -ForegroundColor Green

    # Get category
    $categories = Invoke-RestMethod -Uri "$newApi/api/categories"
    $category = $categories | Where-Object { $_.slug -eq "zhanalyqtar" }
    Write-Host "Category: $($category.nameKz)" -ForegroundColor Green

    # Get WordPress posts
    $wpPosts = Invoke-RestMethod -Uri "$oldSite/wp-json/wp/v2/posts?per_page=10"
    Write-Host "Fetched $($wpPosts.Count) articles`n" -ForegroundColor Green

    # Import articles
    $imported = 0
    foreach ($wpPost in $wpPosts) {
        $title = $wpPost.title.rendered -replace '<[^>]+>', ''
        $cleanTitle = $title.ToLower() -replace '[^a-z0-9]', '-'
        $slug = "$cleanTitle-wp$($wpPost.id)"

        $article = @{
            titleKz = $title
            slugKz = $slug
            contentKz = $wpPost.content.rendered
            excerptKz = $title.Substring(0, [Math]::Min(200, $title.Length))
            categoryId = $category.id
            authorId = $auth.user.id
            status = "PUBLISHED"
            published = $true
        } | ConvertTo-Json -Depth 10

        try {
            $headers = @{
                "Authorization" = "Bearer $($auth.accessToken)"
                "Content-Type" = "application/json"
            }
            Invoke-RestMethod -Uri "$newApi/api/articles" -Method POST -Body $article -Headers $headers | Out-Null
            Write-Host "[OK] [$($imported+1)] $($title.Substring(0,50))..." -ForegroundColor Green
            $imported++
        } catch {
            Write-Host "[SKIP] Failed to import article" -ForegroundColor Yellow
        }
    }

    Write-Host "`n=== COMPLETED ===" -ForegroundColor Green
    Write-Host "Imported: $imported articles" -ForegroundColor Cyan
    [Console]::Beep(1000, 300)

} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    [Console]::Beep(400, 500)
} finally {
    Write-Host "`nPress Enter to close..." -ForegroundColor Gray
    Read-Host
}
