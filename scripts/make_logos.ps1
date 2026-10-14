$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class LogoProcessor
{
    public static void ProcessLogo(string inputPath, string fullLogoOut, string crestOut)
    {
        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;

            Bitmap fullBmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);

            BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
            BitmapData dstData = fullBmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

            byte[] srcBytes = new byte[srcData.Stride * h];
            byte[] dstBytes = new byte[dstData.Stride * h];

            Marshal.Copy(srcData.Scan0, srcBytes, 0, srcBytes.Length);
            src.UnlockBits(srcData);

            byte[,] mask = new byte[w, h]; // 1 = transparent background
            Queue<Point> q = new Queue<Point>();

            Func<int, int, bool> isNearWhite = (x, y) => {
                int idx = y * srcData.Stride + x * 3;
                byte b = srcBytes[idx];
                byte g = srcBytes[idx + 1];
                byte r = srcBytes[idx + 2];
                return (r >= 238 && g >= 238 && b >= 238);
            };

            Action<int, int> enqueueSeed = (x, y) => {
                if (x >= 0 && x < w && y >= 0 && y < h && mask[x, y] == 0 && isNearWhite(x, y))
                {
                    mask[x, y] = 1;
                    q.Enqueue(new Point(x, y));
                }
            };

            // 1. Seed borders (outer canvas background)
            for (int x = 0; x < w; x++)
            {
                enqueueSeed(x, 0);
                enqueueSeed(x, h - 1);
            }
            for (int y = 0; y < h; y++)
            {
                enqueueSeed(0, y);
                enqueueSeed(w - 1, y);
            }

            // 2. Seed inner canvas white areas inside crest
            enqueueSeed(246, 75);
            enqueueSeed(246, 60);
            enqueueSeed(300, 100);
            enqueueSeed(60, 240);

            int[] dx = { 0, 0, 1, -1 };
            int[] dy = { 1, -1, 0, 0 };

            while (q.Count > 0)
            {
                Point p = q.Dequeue();
                for (int i = 0; i < 4; i++)
                {
                    int nx = p.X + dx[i];
                    int ny = p.Y + dy[i];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[nx, ny] == 0)
                    {
                        if (isNearWhite(nx, ny))
                        {
                            // Guard: Do NOT clear tricolor ribbon white stripes!
                            bool isFlag1 = (nx >= 104 && nx <= 226 && ny >= 242 && ny <= 290);
                            bool isFlag2 = (nx >= 243 && nx <= 268 && ny >= 257 && ny <= 301);
                            bool isFlag3 = (nx >= 285 && nx <= 412 && ny >= 314 && ny <= 346);

                            if (isFlag1 || isFlag2 || isFlag3)
                            {
                                continue;
                            }

                            mask[nx, ny] = 1;
                            q.Enqueue(new Point(nx, ny));
                        }
                    }
                }
            }

            int[] allDx = { 0, 0, 1, -1, 1, 1, -1, -1 };
            int[] allDy = { 1, -1, 0, 0, 1, -1, 1, -1 };

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int sIdx = y * srcData.Stride + x * 3;
                    int dIdx = y * dstData.Stride + x * 4;

                    byte b = srcBytes[sIdx];
                    byte g = srcBytes[sIdx + 1];
                    byte r = srcBytes[sIdx + 2];

                    if (mask[x, y] == 1)
                    {
                        dstBytes[dIdx] = 0;
                        dstBytes[dIdx + 1] = 0;
                        dstBytes[dIdx + 2] = 0;
                        dstBytes[dIdx + 3] = 0;
                    }
                    else
                    {
                        int bgNeighbors = 0;
                        for (int i = 0; i < 8; i++)
                        {
                            int nx = x + allDx[i];
                            int ny = y + allDy[i];
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[nx, ny] == 1)
                            {
                                bgNeighbors++;
                            }
                        }

                        if (bgNeighbors > 0)
                        {
                            int minChan = Math.Min(r, Math.Min(g, b));
                            double alpha = 1.0;
                            if (minChan > 175)
                            {
                                double whiteness = (minChan - 175.0) / 80.0;
                                alpha = Math.Max(0.12, 1.0 - (whiteness * (bgNeighbors / 8.0)));
                            }
                            byte a = (byte)Math.Min(255, Math.Max(0, (int)(alpha * 255)));
                            dstBytes[dIdx] = b;
                            dstBytes[dIdx + 1] = g;
                            dstBytes[dIdx + 2] = r;
                            dstBytes[dIdx + 3] = a;
                        }
                        else
                        {
                            dstBytes[dIdx] = b;
                            dstBytes[dIdx + 1] = g;
                            dstBytes[dIdx + 2] = r;
                            dstBytes[dIdx + 3] = 255;
                        }
                    }
                }
            }

            Marshal.Copy(dstBytes, 0, dstData.Scan0, dstBytes.Length);
            fullBmp.UnlockBits(dstData);

            fullBmp.Save(fullLogoOut, ImageFormat.Png);
            Console.WriteLine("Saved full logo: " + fullLogoOut);

            // PERFECT CENTERING:
            // Star center is at X = 246.
            // Crest left is X = 18 (dist = 228).
            // Crest right is X = 449 (dist = 203).
            // Let canvas size = 480 x 480.
            // Canvas center = 240, 240.
            // Star center placed at X = 240!
            // Star top is at Y = 26.
            // Bottom of emblem is at Y = 391.
            // Height = 365. Center Y = 208.5.
            // Placing center Y at 240:
            // offsetY = 240 - 208.5 = 31.5 -> 32.
            // offsetX = 240 - 246 = -6.
            // So pixel (x, y) in src goes to (x - 6, y + 32) in 480x480 canvas!
            // Let's verify bounds in destination:
            // Leftmost pixel: 18 - 6 = 12 (margin = 12px)
            // Rightmost pixel: 449 - 6 = 443 (margin = 37px)
            // Topmost pixel: 26 + 32 = 58
            // Bottommost pixel: 391 + 32 = 423 (margin = 57px)
            // Perfectly contained, exactly centered on the star and circular axis!

            int crestSize = 480;
            Bitmap crestBmp = new Bitmap(crestSize, crestSize, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(crestBmp))
            {
                g.Clear(Color.Transparent);
                g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

                int offX = 240 - 246; // -6
                int offY = 240 - 208; // +32

                // Draw the crest section
                int cropX = 18;
                int cropY = 24;
                int cropW = 432;
                int cropH = 370;

                g.DrawImage(fullBmp,
                    new Rectangle(cropX + offX, cropY + offY, cropW, cropH),
                    new Rectangle(cropX, cropY, cropW, cropH),
                    GraphicsUnit.Pixel);
            }

            crestBmp.Save(crestOut, ImageFormat.Png);
            Console.WriteLine("Saved centered crest: " + crestOut);

            fullBmp.Dispose();
            crestBmp.Dispose();
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing

$srcFile = "C:\Users\06362\.gemini\antigravity-ide\brain\7ee89af3-1118-4f96-a40f-2fbd1b8bc942\.user_uploaded\media_1791947027746.jpg"
$fullLogo = "C:\Users\06362\Desktop\SIH26251-SenaAapurti\public\images\sena_official_logo.png"
$fullLogoTrans = "C:\Users\06362\Desktop\SIH26251-SenaAapurti\public\images\sena_official_logo_transparent.png"
$crestLogo = "C:\Users\06362\Desktop\SIH26251-SenaAapurti\public\images\sena_crest_logo.png"

[LogoProcessor]::ProcessLogo($srcFile, $fullLogo, $crestLogo)
Copy-Item -Path $fullLogo -Destination $fullLogoTrans -Force
Write-Host "Logo generation completed."
