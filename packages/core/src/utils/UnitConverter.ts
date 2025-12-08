/**
 * 单位转换工具类
 * 处理 Word 文档中的各种度量单位转换
 */
export class UnitConverter {
  // 基础转换常量
  private static readonly DPI = 96; // 屏幕 DPI
  private static readonly POINTS_PER_INCH = 72;
  private static readonly TWIPS_PER_POINT = 20;
  private static readonly TWIPS_PER_INCH = 1440; // 72 * 20
  private static readonly EMUS_PER_INCH = 914400;
  private static readonly EMUS_PER_POINT = 12700;
  private static readonly CM_PER_INCH = 2.54;
  private static readonly MM_PER_INCH = 25.4;

  /**
   * Twips 转像素
   * 1 twip = 1/20 点 = 1/1440 英寸
   */
  static twipsToPixels(twips: number): number {
    return (twips / this.TWIPS_PER_INCH) * this.DPI;
  }

  /**
   * 像素转 Twips
   */
  static pixelsToTwips(pixels: number): number {
    return (pixels / this.DPI) * this.TWIPS_PER_INCH;
  }

  /**
   * 点转像素
   */
  static pointsToPixels(points: number): number {
    return (points / this.POINTS_PER_INCH) * this.DPI;
  }

  /**
   * 像素转点
   */
  static pixelsToPoints(pixels: number): number {
    return (pixels / this.DPI) * this.POINTS_PER_INCH;
  }

  /**
   * EMUs 转像素
   * EMU (English Metric Unit) = 1/914400 英寸
   */
  static emusToPixels(emus: number): number {
    return (emus / this.EMUS_PER_INCH) * this.DPI;
  }

  /**
   * 像素转 EMUs
   */
  static pixelsToEmus(pixels: number): number {
    return (pixels / this.DPI) * this.EMUS_PER_INCH;
  }

  /**
   * EMUs 转点
   */
  static emusToPoints(emus: number): number {
    return emus / this.EMUS_PER_POINT;
  }

  /**
   * 点转 EMUs
   */
  static pointsToEmus(points: number): number {
    return points * this.EMUS_PER_POINT;
  }

  /**
   * 英寸转像素
   */
  static inchesToPixels(inches: number): number {
    return inches * this.DPI;
  }

  /**
   * 像素转英寸
   */
  static pixelsToInches(pixels: number): number {
    return pixels / this.DPI;
  }

  /**
   * 厘米转像素
   */
  static cmToPixels(cm: number): number {
    return (cm / this.CM_PER_INCH) * this.DPI;
  }

  /**
   * 像素转厘米
   */
  static pixelsToCm(pixels: number): number {
    return (pixels / this.DPI) * this.CM_PER_INCH;
  }

  /**
   * 毫米转像素
   */
  static mmToPixels(mm: number): number {
    return (mm / this.MM_PER_INCH) * this.DPI;
  }

  /**
   * 像素转毫米
   */
  static pixelsToMm(pixels: number): number {
    return (pixels / this.DPI) * this.MM_PER_INCH;
  }

  /**
   * 半点转像素
   * Word 中字号使用半点表示
   */
  static halfPointsToPixels(halfPoints: number): number {
    return this.pointsToPixels(halfPoints / 2);
  }

  /**
   * 像素转半点
   */
  static pixelsToHalfPoints(pixels: number): number {
    return this.pixelsToPoints(pixels) * 2;
  }

  /**
   * 八分之一点转像素
   * 用于边框宽度等
   */
  static eighthPointsToPixels(eighthPoints: number): number {
    return this.pointsToPixels(eighthPoints / 8);
  }

  /**
   * 像素转八分之一点
   */
  static pixelsToEighthPoints(pixels: number): number {
    return this.pixelsToPoints(pixels) * 8;
  }

  /**
   * 百分比转小数
   * Word 中百分比通常以 1000 为基数
   */
  static percentToDecimal(percent: number, base = 1000): number {
    return percent / base;
  }

  /**
   * 小数转百分比
   */
  static decimalToPercent(decimal: number, base = 1000): number {
    return decimal * base;
  }

  /**
   * 行距值转行高倍数
   * Word 中 240 = 单倍行距
   */
  static lineSpacingToMultiplier(lineSpacing: number): number {
    return lineSpacing / 240;
  }

  /**
   * 行高倍数转行距值
   */
  static multiplierToLineSpacing(multiplier: number): number {
    return multiplier * 240;
  }

  /**
   * 根据缩放比例调整像素值
   */
  static scalePixels(pixels: number, scale: number): number {
    return pixels * scale;
  }

  /**
   * 格式化像素值为 CSS 字符串
   */
  static formatPixels(pixels: number, unit: 'px' | 'pt' | 'em' | 'rem' = 'px'): string {
    switch (unit) {
      case 'pt':
        return `${this.pixelsToPoints(pixels).toFixed(2)}pt`;
      case 'em':
        return `${(pixels / 16).toFixed(4)}em`;
      case 'rem':
        return `${(pixels / 16).toFixed(4)}rem`;
      default:
        return `${pixels.toFixed(2)}px`;
    }
  }

  /**
   * 解析 CSS 尺寸值
   */
  static parseCssSize(value: string): number {
    const match = value.match(/^([0-9.]+)(px|pt|em|rem|cm|mm|in)?$/i);
    if (!match) return 0;

    const num = parseFloat(match[1] || '0');
    const unit = (match[2] || 'px').toLowerCase();

    switch (unit) {
      case 'pt':
        return this.pointsToPixels(num);
      case 'em':
      case 'rem':
        return num * 16;
      case 'cm':
        return this.cmToPixels(num);
      case 'mm':
        return this.mmToPixels(num);
      case 'in':
        return this.inchesToPixels(num);
      default:
        return num;
    }
  }

  /**
   * 将角度从度转换为弧度
   */
  static degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 将角度从弧度转换为度
   */
  static radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * Word 旋转角度转换
   * Word 使用 60000 分之一度
   */
  static wordRotationToDegrees(rotation: number): number {
    return rotation / 60000;
  }

  /**
   * 度转换为 Word 旋转角度
   */
  static degreesToWordRotation(degrees: number): number {
    return degrees * 60000;
  }
}
