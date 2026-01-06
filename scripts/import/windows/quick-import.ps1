# Быстрый импорт статей с WordPress
# PowerShell скрипт для Windows

$oldSite = "https://aimaqaqshamy.kz"
$newApi = "https://aimak-api-w8ps.onrender.com"
$email = "admin@aimakakshamy.kz"
$password = "admin123"

Write-Host "=== ИМПОРТ СТАТЕЙ ===" -ForegroundColor Cyan

# 1. Логин
Write-Host "1. Вход в систему..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$newApi/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken
$adminId = $loginResponse.user.id

Write-Host "   Вход выполнен как: $($loginResponse.user.email)" -ForegroundColor Green

# 2. Получить категорию
Write-Host "2. Получение категории..." -ForegroundColor Yellow
$categories = Invoke-RestMethod -Uri "$newApi/api/categories" -Method GET
$category = $categories | Where-Object { $_.slug -eq "zhanalyqtar" }

if ($null -eq $category) {
    Write-Host "   Ошибка: категория не найдена" -ForegroundColor Red
    exit
}

Write-Host "   Категория: $($category.nameKz)" -ForegroundColor Green

# 3. Получить статьи из WordPress
Write-Host "3. Получение статей с WordPress..." -ForegroundColor Yellow
$wpPosts = Invoke-RestMethod -Uri "$oldSite/wp-json/wp/v2/posts?per_page=10" -Method GET

Write-Host "   Получено $($wpPosts.Count) статей" -ForegroundColor Green

# 4. Импорт статей
Write-Host "4. Импорт статей..." -ForegroundColor Yellow

$imported = 0
$failed = 0

foreach ($wpPost in $wpPosts) {
    try {
        $title = $wpPost.title.rendered -replace '<[^>]+>', '' -replace '&nbsp;', ' '
        $content = $wpPost.content.rendered
        $excerpt = if ($wpPost.excerpt.rendered) {
            $wpPost.excerpt.rendered -replace '<[^>]+>', ''
        } else {
            $title.Substring(0, [Math]::Min(200, $title.Length))
        }

        # Создаём slug
        $slug = $title.ToLower() `
            -replace 'қ', 'q' `
            -replace 'ә', 'a' `
            -replace 'ғ', 'g' `
            -replace 'ұ', 'u' `
            -replace 'ү', 'u' `
            -replace 'і', 'i' `
            -replace 'ң', 'n' `
            -replace 'һ', 'h' `
            -replace 'ө', 'o' `
            -replace '[^a-z0-9]', '-' `
            -replace '-+', '-' `
            -replace '^-|-$', ''

        $slug = $slug.Substring(0, [Math]::Min(100, $slug.Length)) + "-$($wpPost.id)"

        $articleData = @{
            titleKz = $title
            slugKz = $slug
            contentKz = $content
            excerptKz = $excerpt
            categoryId = $category.id
            authorId = $adminId
            status = "PUBLISHED"
            published = $true
            publishedAt = $wpPost.date
        } | ConvertTo-Json -Depth 10

        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

        $result = Invoke-RestMethod -Uri "$newApi/api/articles" -Method POST -Body $articleData -Headers $headers

        Write-Host "   ✓ [$($imported + 1)] $($title.Substring(0, [Math]::Min(60, $title.Length)))..." -ForegroundColor Green
        $imported++

        Start-Sleep -Milliseconds 100
    }
    catch {
        Write-Host "   ✗ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=== РЕЗУЛЬТАТ ===" -ForegroundColor Cyan
Write-Host "Импортировано: $imported" -ForegroundColor Green
Write-Host "Ошибок: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Проверьте статьи на сайте: https://aimak-web-rvep.onrender.com" -ForegroundColor Yellow
