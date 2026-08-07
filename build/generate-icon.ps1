# 生成应用图标（同心圆设计，代表地铁站）
# 输出: build\icon.ico (多尺寸), build\icon.png (512x512)
Add-Type -AssemblyName System.Drawing

function Draw-Icon([int]$size) {
    $bmp = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $center = $size / 2.0
    $bgColor = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
    $accent = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

    # 圆角矩形背景
    $radius = [int]($size * 0.22)
    $w1 = $size - 1
    $rect = [System.Drawing.Rectangle]::new(0, 0, $w1, $w1)
    $bgPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $bgPath.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $bgPath.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $bgPath.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $bgPath.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $bgPath.CloseFigure()
    $bgBrush = [System.Drawing.SolidBrush]::new($bgColor)
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()

    # 外圈: 橙色描边圆
    $outerR = $size * 0.36
    $stroke = [Math]::Max(2.0, $size * 0.05)
    $pen = [System.Drawing.Pen]::new($accent, [float]$stroke)
    $g.DrawEllipse($pen, [float]($center - $outerR), [float]($center - $outerR), [float]($outerR * 2), [float]($outerR * 2))
    $pen.Dispose()

    # 内圈: 白色实心圆
    $innerR = $size * 0.14
    $whiteBrush = [System.Drawing.SolidBrush]::new($white)
    $g.FillEllipse($whiteBrush, [float]($center - $innerR), [float]($center - $innerR), [float]($innerR * 2), [float]($innerR * 2))
    $whiteBrush.Dispose()

    $g.Dispose()
    return $bmp
}

# 生成多尺寸 ICO (PNG 嵌入格式, Vista+)
function Save-MultiIcon($bmp256, $sizes, $outPath) {
    $ms = [System.IO.MemoryStream]::new()
    $bw = [System.IO.BinaryWriter]::new($ms)

    # ICONDIR header
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$sizes.Count)

    # 每个尺寸转 PNG 字节
    $pngs = [System.Collections.ArrayList]::new()
    foreach ($s in $sizes) {
        if ($s -eq 256) {
            $bmp = $bmp256
        } else {
            $bmp = [System.Drawing.Bitmap]::new($s, $s)
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.DrawImage($bmp256, 0, 0, $s, $s)
            $g.Dispose()
        }
        $pngMs = [System.IO.MemoryStream]::new()
        $bmp.Save($pngMs, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngs.Add($pngMs.ToArray()) | Out-Null
        if ($s -ne 256) { $bmp.Dispose() }
    }

    # ICONDIRENTRY 数组
    $offset = 6 + 16 * $sizes.Count
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $s = $sizes[$i]
        $dim = if ($s -eq 256) { [byte]0 } else { [byte]$s }
        $bw.Write($dim)                          # width
        $bw.Write($dim)                          # height
        $bw.Write([byte]0)                       # color count
        $bw.Write([byte]0)                       # reserved
        $bw.Write([uint16]1)                     # planes
        $bw.Write([uint16]32)                    # bit count
        $bw.Write([uint32]$pngs[$i].Length)      # image size
        $bw.Write([uint32]$offset)               # offset
        $offset += $pngs[$i].Length
    }

    # 图像数据
    foreach ($png in $pngs) {
        $bw.Write($png)
    }

    [System.IO.File]::WriteAllBytes($outPath, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()
}

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$icoPath = Join-Path $outDir "icon.ico"
$pngPath = Join-Path $outDir "icon.png"

$bmp256 = Draw-Icon 256
$sizes = @(256, 128, 64, 48, 32, 16)
Save-MultiIcon $bmp256 $sizes $icoPath
Write-Host "ICO: $icoPath ($((Get-Item $icoPath).Length) bytes)"

$bmp512 = Draw-Icon 512
$bmp512.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "PNG: $pngPath ($((Get-Item $pngPath).Length) bytes)"

$bmp256.Dispose()
$bmp512.Dispose()
