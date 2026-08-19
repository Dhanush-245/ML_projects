export interface ColumnMeta {
  key: string;
  label: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  missingCount: number;
}

export interface SummaryStat {
  column: string;
  type: string;
  mean: number | string;
  std: number | string;
  min: number | string;
  max: number | string;
  missing: number;
  unique: number;
}

export interface QualityIssue {
  id: string;
  column: string;
  type: 'missing' | 'outlier' | 'constant' | 'cardinality' | 'duplicate';
  title: string;
  desc: string;
  severity: 'high' | 'medium' | 'low';
}

export interface OutlierDetail {
  column: string;
  count: number;
  lowerBound: number;
  upperBound: number;
  pct: number;
}

export interface ParsedDataset {
  id: string;
  name: string;
  rows: number;
  columns: ColumnMeta[];
  data: Record<string, any>[];
  missingValuesCount: number;
  duplicateRowsCount: number;
  qualityScore: number;
  qualityIssues: QualityIssue[];
  summaryStats: SummaryStat[];
  numericColStats: Record<string, { buckets: { name: string; count: number }[] }>;
  correlations: Record<string, Record<string, number>>;
  outlierStats: Record<string, OutlierDetail>;
  backendId?: number;
  createdAt?: string;
}

export function isValueMissing(val: any): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return (
    str === '' ||
    str === 'null' ||
    str === 'none' ||
    str === 'na' ||
    str === 'nan' ||
    str === 'n/a' ||
    str === '?' ||
    str === '-' ||
    str === 'missing' ||
    str === 'undefined' ||
    str === '#n/a' ||
    str === '#na' ||
    str === '-999' ||
    str === '-9999'
  );
}

export function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Math.round((num / den) * 100) / 100;
}

// Compute Association / Correlation between any Feature and any Target (Numeric or Categorical)
export function computeFeatureTargetCorrelation(data: Record<string, any>[], featureCol: string, targetCol: string): number {
  const validPairs = data.filter(r => !isValueMissing(r[featureCol]) && !isValueMissing(r[targetCol]));
  if (validPairs.length === 0) return 0;

  const featureVals = validPairs.map(r => r[featureCol]);
  const targetVals = validPairs.map(r => r[targetCol]);

  // If feature is numeric & target is numeric -> Pearson Correlation
  if (typeof featureVals[0] === 'number' && typeof targetVals[0] === 'number') {
    return computePearsonCorrelation(featureVals as number[], targetVals as number[]);
  }

  // If feature is numeric & target is categorical -> Eta-squared (ANOVA / Group mean correlation)
  if (typeof featureVals[0] === 'number' && typeof targetVals[0] !== 'number') {
    const numX = featureVals as number[];
    const catY = targetVals.map(String);
    const globalMean = numX.reduce((a, b) => a + b, 0) / numX.length;

    const groupSums: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    catY.forEach((cat, i) => {
      groupSums[cat] = (groupSums[cat] || 0) + numX[i];
      groupCounts[cat] = (groupCounts[cat] || 0) + 1;
    });

    let ssBetween = 0;
    let ssTotal = 0;

    Object.keys(groupSums).forEach((cat) => {
      const meanCat = groupSums[cat] / groupCounts[cat];
      ssBetween += groupCounts[cat] * Math.pow(meanCat - globalMean, 2);
    });

    numX.forEach((x) => {
      ssTotal += Math.pow(x - globalMean, 2);
    });

    if (ssTotal === 0) return 0;
    const etaSq = Math.sqrt(Math.max(0, ssBetween / ssTotal));
    return Math.round(etaSq * 100) / 100;
  }

  // If feature is categorical & target is numeric
  if (typeof featureVals[0] !== 'number' && typeof targetVals[0] === 'number') {
    const numY = targetVals as number[];
    const catX = featureVals.map(String);
    const globalMean = numY.reduce((a, b) => a + b, 0) / numY.length;

    const groupSums: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    catX.forEach((cat, i) => {
      groupSums[cat] = (groupSums[cat] || 0) + numY[i];
      groupCounts[cat] = (groupCounts[cat] || 0) + 1;
    });

    let ssBetween = 0;
    let ssTotal = 0;

    Object.keys(groupSums).forEach((cat) => {
      const meanCat = groupSums[cat] / groupCounts[cat];
      ssBetween += groupCounts[cat] * Math.pow(meanCat - globalMean, 2);
    });

    numY.forEach((y) => {
      ssTotal += Math.pow(y - globalMean, 2);
    });

    if (ssTotal === 0) return 0;
    const etaSq = Math.sqrt(Math.max(0, ssBetween / ssTotal));
    return Math.round(etaSq * 100) / 100;
  }

  // Categorical vs Categorical -> Cramer's V
  const catX = featureVals.map(String);
  const catY = targetVals.map(String);
  const xLevels = [...new Set(catX)];
  const yLevels = [...new Set(catY)];
  if (xLevels.length < 2 || yLevels.length < 2) return 0;
  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  const observed = new Map<string, number>();
  catX.forEach((x, index) => {
    const y = catY[index];
    rowTotals.set(x, (rowTotals.get(x) || 0) + 1);
    colTotals.set(y, (colTotals.get(y) || 0) + 1);
    observed.set(`${x}\u0000${y}`, (observed.get(`${x}\u0000${y}`) || 0) + 1);
  });
  let chiSquared = 0;
  xLevels.forEach((x) => yLevels.forEach((y) => {
    const expected = ((rowTotals.get(x) || 0) * (colTotals.get(y) || 0)) / validPairs.length;
    if (expected > 0) chiSquared += Math.pow((observed.get(`${x}\u0000${y}`) || 0) - expected, 2) / expected;
  }));
  const denominator = Math.min(xLevels.length - 1, yLevels.length - 1);
  const cramersV = denominator > 0 ? Math.sqrt((chiSquared / validPairs.length) / denominator) : 0;
  return Math.round(Math.min(1, cramersV) * 100) / 100;
}

export function parseCSVText(csvText: string, filename: string): ParsedDataset {
  const lines = csvText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const header = parseRow(lines[0]);
  const rawRows = lines.slice(1).map((line) => parseRow(line));

  const dataRecords: Record<string, any>[] = [];
  let totalMissing = 0;

  const colValuesMap: Record<string, any[]> = {};
  header.forEach((col) => {
    colValuesMap[col] = [];
  });

  rawRows.forEach((rowValues) => {
    if (rowValues.length < header.length / 2) return;
    const record: Record<string, any> = {};
    header.forEach((col, idx) => {
      const rawVal = rowValues[idx];
      if (isValueMissing(rawVal)) {
        record[col] = null;
        colValuesMap[col].push(null);
        totalMissing++;
      } else {
        const num = Number(rawVal);
        if (!isNaN(num) && rawVal.trim() !== '') {
          record[col] = num;
          colValuesMap[col].push(num);
        } else {
          record[col] = rawVal;
          colValuesMap[col].push(rawVal);
        }
      }
    });
    dataRecords.push(record);
  });

  // Duplicate Row Detection
  const rowJsonSet = new Set<string>();
  let duplicateCount = 0;
  dataRecords.forEach((row) => {
    const str = JSON.stringify(row);
    if (rowJsonSet.has(str)) {
      duplicateCount++;
    } else {
      rowJsonSet.add(str);
    }
  });

  const columnsMeta: ColumnMeta[] = [];
  const summaryStats: SummaryStat[] = [];
  const numericColStats: Record<string, { buckets: { name: string; count: number }[] }> = {};
  const outlierStats: Record<string, OutlierDetail> = {};
  const qualityIssues: QualityIssue[] = [];

  if (duplicateCount > 0) {
    const pct = ((duplicateCount / dataRecords.length) * 100).toFixed(1);
    qualityIssues.push({
      id: 'duplicate-rows',
      column: 'Dataset',
      type: 'duplicate',
      title: `Duplicate Rows Detected`,
      desc: `Found ${duplicateCount} duplicate rows (${pct}% of total records).`,
      severity: duplicateCount > 10 ? 'high' : 'medium',
    });
  }

  const numericColValues: Record<string, number[]> = {};

  header.forEach((col) => {
    const vals = colValuesMap[col];
    const nonNullVals = vals.filter((v) => v !== null);
    const missingCount = vals.length - nonNullVals.length;

    const numericVals = nonNullVals.filter((v) => typeof v === 'number') as number[];
    const isNumeric = numericVals.length > nonNullVals.length * 0.7 && nonNullVals.length > 0;
    const uniqueCount = new Set(nonNullVals.map(String)).size;

    const dateValues = nonNullVals.filter((value) => typeof value === 'string' && !Number.isNaN(Date.parse(value)));
    const isDatetime = !isNumeric && dateValues.length > nonNullVals.length * 0.7 && nonNullVals.length > 0;
    let colType: ColumnMeta['type'] = 'categorical';
    if (isNumeric) colType = 'numeric';
    else if (isDatetime) colType = 'datetime';
    else if (uniqueCount > Math.max(20, dataRecords.length * 0.5)) colType = 'text';

    columnsMeta.push({
      key: col,
      label: col,
      type: colType,
      missingCount,
    });

    if (isNumeric && numericVals.length > 0) {
      numericColValues[col] = dataRecords.map((r) => r[col]).filter((v) => typeof v === 'number') as number[];
      numericVals.sort((a, b) => a - b);
      const min = numericVals[0];
      const max = numericVals[numericVals.length - 1];
      const sum = numericVals.reduce((acc, curr) => acc + curr, 0);
      const mean = sum / numericVals.length;
      const std = Math.sqrt(
        numericVals.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / numericVals.length
      );

      summaryStats.push({
        column: col,
        type: 'numeric',
        mean: Math.round(mean * 100) / 100,
        std: Math.round(std * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        missing: missingCount,
        unique: uniqueCount,
      });

      const range = max - min;
      if (range > 0) {
        const bucketCount = 5;
        const step = range / bucketCount;
        const buckets = Array.from({ length: bucketCount }).map((_, bIdx) => {
          const bStart = min + bIdx * step;
          const bEnd = min + (bIdx + 1) * step;
          const count = numericVals.filter(
            (val) => val >= bStart && (bIdx === bucketCount - 1 ? val <= bEnd : val < bEnd)
          ).length;
          return {
            name: `${Math.round(bStart)}-${Math.round(bEnd)}`,
            count,
          };
        });
        numericColStats[col] = { buckets };
      }

      // Outlier detection
      const q1 = numericVals[Math.floor(numericVals.length * 0.25)];
      const q3 = numericVals[Math.floor(numericVals.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = numericVals.filter((v) => v < lowerBound || v > upperBound);

      outlierStats[col] = {
        column: col,
        count: outliers.length,
        lowerBound: Math.round(lowerBound * 100) / 100,
        upperBound: Math.round(upperBound * 100) / 100,
        pct: Math.round(((outliers.length / dataRecords.length) * 100) * 10) / 10,
      };

      if (outliers.length > 0) {
        qualityIssues.push({
          id: `outlier-${col}`,
          column: col,
          type: 'outlier',
          title: `Outliers detected in "${col}"`,
          desc: `Found ${outliers.length} values outside 1.5x IQR range [${Math.round(lowerBound)}, ${Math.round(upperBound)}].`,
          severity: outliers.length > dataRecords.length * 0.05 ? 'high' : 'medium',
        });
      }
    } else {
      const frequencies = new Map<string, number>();
      vals.forEach((value) => {
        const label = value === null ? 'Missing' : String(value);
        frequencies.set(label, (frequencies.get(label) || 0) + 1);
      });
      numericColStats[col] = {
        buckets: [...frequencies.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([name, count]) => ({ name, count })),
      };
      summaryStats.push({
        column: col,
        type: 'categorical',
        mean: '-',
        std: '-',
        min: '-',
        max: '-',
        missing: missingCount,
        unique: uniqueCount,
      });
    }

    if (missingCount > 0) {
      const pct = ((missingCount / dataRecords.length) * 100).toFixed(1);
      qualityIssues.push({
        id: `missing-${col}`,
        column: col,
        type: 'missing',
        title: `Missing Values in "${col}"`,
        desc: `${missingCount} rows (${pct}%) have missing values.`,
        severity: Number(pct) > 10 ? 'high' : 'medium',
      });
    }

    if (uniqueCount > dataRecords.length * 0.8 && colType === 'categorical' && dataRecords.length > 20) {
      qualityIssues.push({
        id: `cardinality-${col}`,
        column: col,
        type: 'cardinality',
        title: `High Cardinality in "${col}"`,
        desc: `${uniqueCount} unique categories out of ${dataRecords.length} rows.`,
        severity: 'low',
      });
    }

    if (uniqueCount === 1 && nonNullVals.length > 0) {
      qualityIssues.push({
        id: `constant-${col}`,
        column: col,
        type: 'constant',
        title: `Constant Column "${col}"`,
        desc: `Column contains only 1 unique value across all rows.`,
        severity: 'high',
      });
    }
  });

  // Calculate Correlations Matrix across ALL columns (Numeric & Categorical)
  const correlations: Record<string, Record<string, number>> = {};
  header.forEach((col1) => {
    correlations[col1] = {};
    header.forEach((col2) => {
      if (col1 === col2) {
        correlations[col1][col2] = 1.0;
      } else {
        correlations[col1][col2] = computeFeatureTargetCorrelation(dataRecords, col1, col2);
      }
    });
  });

  const totalCells = Math.max(1, dataRecords.length * header.length);
  const qualityPenalty = (totalMissing / totalCells) * 100 + duplicateCount * 3 + qualityIssues.length * 5;
  const qualityScore = Math.max(10, Math.min(100, Math.round(100 - qualityPenalty)));

  return {
    id: 'ds-' + Date.now(),
    name: filename,
    rows: dataRecords.length,
    columns: columnsMeta,
    data: dataRecords,
    missingValuesCount: totalMissing,
    duplicateRowsCount: duplicateCount,
    qualityScore,
    qualityIssues,
    summaryStats,
    numericColStats,
    correlations,
    outlierStats,
  };
}

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const normalized = value instanceof Date ? value.toISOString() : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function parseRecordData(records: Record<string, unknown>[], filename: string): ParsedDataset {
  if (!records.length) throw new Error('Dataset contains no rows');
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  if (!headers.length) throw new Error('Dataset contains no columns');
  const csv = [
    headers.map(escapeCSVValue).join(','),
    ...records.map((record) => headers.map((header) => escapeCSVValue(record[header])).join(',')),
  ].join('\n');
  return parseCSVText(csv, filename);
}

export async function parseTabularFile(file: File): Promise<ParsedDataset> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'txt') return parseCSVText(await file.text(), file.name);
  if (extension === 'json') {
    const parsed = JSON.parse(await file.text());
    const records = Array.isArray(parsed) ? parsed : parsed.records || parsed.data;
    if (!Array.isArray(records)) throw new Error('JSON datasets must contain an array of records');
    return parseRecordData(records, file.name);
  }
  if (extension === 'xlsx' || extension === 'xls') {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) throw new Error('Excel workbook contains no data rows');
    const headers = worksheet.getRow(1).values as unknown[];
    const normalizedHeaders = headers.slice(1).map((value, index) => String(value || `Column_${index + 1}`).trim());
    const records: Record<string, unknown>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, unknown> = {};
      normalizedHeaders.forEach((header, index) => {
        const cellValue: any = row.getCell(index + 1).value;
        record[header] = cellValue && typeof cellValue === 'object' && 'result' in cellValue
          ? cellValue.result
          : cellValue instanceof Date ? cellValue.toISOString() : cellValue;
      });
      records.push(record);
    });
    return parseRecordData(records, file.name);
  }
  throw new Error('Browser analytics support CSV, Excel, and JSON. Parquet files require the backend preview service.');
}

export function downloadDatasetAsCSV(dataset: ParsedDataset, suffix = '_cleaned.csv'): void {
  if (!dataset || !dataset.data || dataset.data.length === 0) return;

  const header = dataset.columns.map((c) => c.key);
  const rows: string[] = [];

  rows.push(header.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  dataset.data.forEach((row) => {
    const rowValues = header.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'number') return String(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    rows.push(rowValues.join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const baseName = dataset.name.endsWith('.csv') ? dataset.name.slice(0, -4) : dataset.name;
  link.setAttribute('href', url);
  link.setAttribute('download', `${baseName}${suffix}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
