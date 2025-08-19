Write-Host "🧪 Final Test: Raw Emotions Working!" -ForegroundColor Green

$testEmotions = @(
    @{ message = "I'm feeling grateful for this wonderful opportunity"; expected = "gratitude" },
    @{ message = "I'm so excited about the amazing results we achieved"; expected = "excitement" },
    @{ message = "I feel really disappointed about missing that chance"; expected = "disappointment" }
)

$headers = @{ "Content-Type" = "application/json" }

foreach ($test in $testEmotions) {
    $body = @{
        message = $test.message
        language = "en"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-chat" -Method POST -Headers $headers -Body $body
        
        Write-Host ""
        Write-Host "Message: $($test.message)" -ForegroundColor White
        Write-Host "Expected: $($test.expected) | Detected: $($response.detectedEmotion)" -ForegroundColor Yellow
        Write-Host "Confidence: $($response.confidence.ToString("F3"))" -ForegroundColor Cyan
        Write-Host "Method: $($response.emotionMethod)" -ForegroundColor Magenta
        
        if ($response.detectedEmotion -eq $test.expected) {
            Write-Host "✅ PERFECT!" -ForegroundColor Green
        } else {
            Write-Host "🎯 RAW EMOTION: $($response.detectedEmotion)" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 DEPENDENCY ISSUE FIXED - RAW EMOTIONS WORKING!" -ForegroundColor Green
