$body = @{
    message = "I'm feeling grateful and excited about this opportunity"
    language = "en"
} | ConvertTo-Json

$headers = @{ "Content-Type" = "application/json" }

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-chat" -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ TypeScript fixes working!" -ForegroundColor Green
    Write-Host "Detected: $($response.detectedEmotion)" -ForegroundColor Yellow
    Write-Host "Confidence: $($response.confidence.ToString("F3"))" -ForegroundColor Cyan
    Write-Host "Method: $($response.emotionMethod)" -ForegroundColor Magenta
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
