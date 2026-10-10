# AI Feedback Loop Project Structure

# Create directories
$basePath = "C:\Users\Dell\OneDrive\Desktop\AiFeedback"
$dirs = @(
    "$basePath\src",
    "$basePath\src\client",
    "$basePath\public"
)

foreach ($dir in $dirs) {
    if (!(Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created directory: $dir"
    }
}

Write-Host "Project structure ready. Now run:"
Write-Host ""
Write-Host "1. Copy the contents from the provided code files to the src directory"
Write-Host "2. npm install"
Write-Host "3. Copy .env.example to .env and add your OpenAI API key"
Write-Host "4. npm run dev"
