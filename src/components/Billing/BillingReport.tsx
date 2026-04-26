import React, { useState, useRef, useMemo } from 'react';
import { Trip, Plant, VENDOR_DETAILS } from '../../types';
import { cn } from '../../lib/utils';
import { Download, FileText, Table as TableIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface BillingReportProps {
  trips: Trip[];
}

export default function BillingReport({ trips }: BillingReportProps) {
  const [selectedPlant, setSelectedPlant] = useState<Plant>('Plant 1');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isGenerating, setIsGenerating] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  const monthsList = useMemo(() => {
    const months = new Set<string>();
    trips.forEach(trip => {
      const date = parseISO(trip.date);
      months.add(format(date, 'yyyy-MM'));
    });
    const currentMonth = format(new Date(), 'yyyy-MM');
    months.add(currentMonth);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [trips]);

  const reportTrips = useMemo(() => {
    return trips
      .filter(trip => trip.plant === selectedPlant && trip.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trips, selectedPlant, selectedMonth]);

  const totalKM = reportTrips.reduce((sum, trip) => sum + trip.totalKM, 0);
  const totalTrips = reportTrips.length;
  const avgKM = totalTrips > 0 ? (totalKM / totalTrips).toFixed(1) : '0.0';

  // Monthly breakdown for overview
  const monthOverview = useMemo(() => {
    const p1 = trips.filter(t => t.plant === 'Plant 1' && t.date.startsWith(selectedMonth));
    const p2 = trips.filter(t => t.plant === 'Plant 2' && t.date.startsWith(selectedMonth));
    
    const p1KM = p1.reduce((sum, t) => sum + t.totalKM, 0);
    const p2KM = p2.reduce((sum, t) => sum + t.totalKM, 0);
    
    return {
      p1: { km: p1KM, trips: p1.length },
      p2: { km: p2KM, trips: p2.length },
      total: { km: p1KM + p2KM, trips: p1.length + p2.length }
    };
  }, [trips, selectedMonth]);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const doc = new jsPDF();
      const monthName = format(parseISO(`${selectedMonth}-01`), 'MMMM');
      const year = format(parseISO(`${selectedMonth}-01`), 'yyyy');

      // 1. Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TRIP BILL', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Monthly Logistics Statement', 14, 26);

      // Business Info (Top Right)
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text('RMC', 196, 20, { align: 'right' });
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('System Generated Report', 196, 24, { align: 'right' });

      doc.setDrawColor(200);
      doc.line(14, 32, 196, 32);

      // 2. Billing Info
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('BILLING MONTH', 14, 42);
      doc.text('PLANT NAME', 70, 42);
      doc.text('VENDOR CODE', 130, 42);
      doc.text('P.O. NUMBER', 196, 42, { align: 'right' });

      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.text(`${monthName} ${year}`, 14, 48);
      doc.text(selectedPlant, 70, 48);
      doc.text(VENDOR_DETAILS.code, 130, 48);
      doc.text(VENDOR_DETAILS.plants[selectedPlant].po, 196, 48, { align: 'right' });

      // 3. Summary Stats
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 56, 182, 20, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(14, 56, 182, 20, 'S');

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'black');
      doc.text('TOTAL TRIPS', 60, 63, { align: 'center' });
      doc.text('TOTAL KILOMETERS', 150, 63, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.text(totalTrips.toString(), 60, 71, { align: 'center' });
      doc.setTextColor(79, 70, 229);
      doc.text(`${totalKM.toFixed(1)} KM`, 150, 71, { align: 'center' });

      // 4. Trip Table
      autoTable(doc, {
        startY: 85,
        head: [['Date', 'Site Name', 'Location', 'Purpose', 'Start', 'End', 'Total KM']],
        body: reportTrips.map(trip => [
          format(parseISO(trip.date), 'dd/MM/yyyy'),
          { content: trip.siteName, styles: { fontSize: 8, fontStyle: 'bold' } },
          { content: trip.location || 'N/A', styles: { fontSize: 8 } },
          trip.purpose === 'Custom' ? trip.customPurpose : trip.purpose,
          trip.startingKM.toFixed(1),
          trip.endingKM.toFixed(1),
          { content: trip.totalKM.toFixed(1), styles: { fontStyle: 'bold' } }
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: 50 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 18, halign: 'right' },
        },
        foot: [['', '', '', '', '', 'Total KM', totalKM.toFixed(1)]],
        footStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10, fontStyle: 'bold', halign: 'right' }
      });

      // 5. Signatures
      const finalY = (doc as any).lastAutoTable.finalY + 30;
      doc.setDrawColor(30);
      doc.line(14, finalY, 64, finalY);
      doc.line(80, finalY, 130, finalY);
      doc.line(146, finalY, 196, finalY);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Supplier Signature', 39, finalY + 5, { align: 'center' });
      doc.text('Verifier Signature', 105, finalY + 5, { align: 'center' });
      doc.text('Plant Head Signature', 171, finalY + 5, { align: 'center' });

      // 6. Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(200);
        doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy • HH:mm:ss')} • Page ${i} of ${pageCount}`, 14, 285);
      }

      const fileName = `${selectedPlant.replace(' ', '')}_Bill_${monthName}_${year}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    const monthName = format(parseISO(`${selectedMonth}-01`), 'MMMM');
    const year = format(parseISO(`${selectedMonth}-01`), 'yyyy');

    // 1. Prepare Trip Data
    const tripData = reportTrips.map(trip => ({
      'Date': format(parseISO(trip.date), 'dd/MM/yyyy'),
      'Site Name': trip.siteName,
      'Location': trip.location || '-',
      'Purpose': trip.purpose === 'Custom' ? trip.customPurpose : trip.purpose,
      'Starting KM': trip.startingKM,
      'Ending KM': trip.endingKM,
      'Total KM': trip.totalKM
    }));

    // 2. Prepare Summary Data
    const summaryData = [
      { 'Metric': 'Plant Name', 'Value': selectedPlant },
      { 'Metric': 'Vendor Code', 'Value': VENDOR_DETAILS.code },
      { 'Metric': 'P.O. Number', 'Value': VENDOR_DETAILS.plants[selectedPlant].po },
      { 'Metric': 'Billing Month', 'Value': `${monthName} ${year}` },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Total Trips', 'Value': totalTrips },
      { 'Metric': 'Total Kilometers', 'Value': totalKM.toFixed(1) }
    ];

    // 3. Create Workbook and Sheets
    const wb = XLSX.utils.book_new();
    
    const wsTrips = XLSX.utils.json_to_sheet(tripData);
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(wb, wsTrips, "Trip Details");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 4. Save File
    const fileName = `${selectedPlant.replace(' ', '')}_Bill_${monthName}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Monthly Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Plant 1 Summary</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">{monthOverview.p1.km.toFixed(1)} <span className="text-xs">KM</span></p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{monthOverview.p1.trips} Trips</p>
            </div>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm shadow-amber-100">P1</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Plant 2 Summary</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">{monthOverview.p2.km.toFixed(1)} <span className="text-xs">KM</span></p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{monthOverview.p2.trips} Trips</p>
            </div>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm shadow-emerald-100">P2</div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-xl shadow-slate-200">
          <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-2">Grand Total Overview</p>
          <div className="flex justify-between items-end text-white">
            <div>
              <p className="text-2xl font-black leading-none">{monthOverview.total.km.toFixed(1)} <span className="text-xs text-white/50">KM</span></p>
              <p className="text-[10px] font-bold text-white/50 uppercase mt-1">{monthOverview.total.trips} Total Trips</p>
            </div>
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
              <TableIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
          Billing Parameters
        </h3>
        
        <div className="flex flex-col lg:flex-row items-end gap-6">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Select Plant</label>
            <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-lg">
              {(['Plant 1', 'Plant 2'] as Plant[]).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPlant(p)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all cursor-pointer",
                    selectedPlant === p 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              {monthsList.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={reportTrips.length === 0 || isGenerating}
              className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-[10px] py-3 px-6 rounded-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Export PDF'}
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={reportTrips.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-[10px] py-3 px-6 rounded-lg shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {reportTrips.length === 0 ? (
        <div className="bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 py-24 text-center">
           <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 mx-auto">
              <FileText className="w-8 h-8 text-slate-200" />
           </div>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No Records Found</p>
           <p className="text-slate-400 text-xs mt-1 italic">No trips recorded for this selection.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl overflow-hidden border border-slate-800">
          <div className="max-h-[85vh] overflow-auto rounded-xl">
            <div 
              ref={billRef}
              className="bg-white w-full mx-auto p-12 text-slate-900 relative"
              style={{ minWidth: '850px' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-8 mb-8">
                <div className="text-left">
                  <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Trip Bill</h1>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Monthly Logistics Statement</p>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="bg-indigo-600 text-white px-4 py-2 rounded font-black text-xl tracking-tight mb-1">RMC</div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">System Generated Report</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-y-10 mb-10 text-sm">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Billing Month</p>
                    <p className="font-bold text-lg leading-tight">{format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Plant Name</p>
                    <p className="font-bold text-lg leading-tight">{selectedPlant}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 text-right justify-items-end">
                  <div>
                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">Vendor Code</p>
                    <p className="font-bold text-lg leading-tight">{VENDOR_DETAILS.code}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase text-[9px] font-black tracking-widest mb-1">P.O. Number</p>
                    <p className="font-bold text-lg leading-tight">{VENDOR_DETAILS.plants[selectedPlant].po}</p>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mb-10 bg-slate-50 border border-slate-200 p-6 rounded-lg grid grid-cols-2 divide-x divide-slate-200">
                 <div className="px-4 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Total Trips</p>
                    <p className="text-2xl font-black text-slate-900">{totalTrips}</p>
                 </div>
                 <div className="px-4 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Total Kilometers</p>
                    <p className="text-2xl font-black text-indigo-600">{totalKM.toFixed(1)} <span className="text-xs">KM</span></p>
                 </div>
              </div>

              {/* Table */}
              <div className="mb-12">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-100 pb-2 mb-4 tracking-widest">Trip Log Details</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 uppercase text-[9px] font-black text-white text-center">
                      <th className="px-3 py-3 border border-slate-900">Date</th>
                      <th className="px-3 py-3 border border-slate-900 text-left">Site Name</th>
                      <th className="px-3 py-3 border border-slate-900 text-left">Location</th>
                      <th className="px-3 py-3 border border-slate-900">Purpose</th>
                      <th className="px-3 py-3 border border-slate-900 text-right">Start</th>
                      <th className="px-3 py-3 border border-slate-900 text-right">End</th>
                      <th className="px-3 py-3 border border-slate-900 text-right">Total KM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTrips.map((trip) => (
                      <tr key={trip.id} className="text-[10px] text-center border-b border-slate-200">
                        <td className="px-3 py-3 font-medium">{format(parseISO(trip.date), 'dd/MM/yyyy')}</td>
                        <td className="px-3 py-3 text-left font-bold text-slate-800">
                          {trip.siteName}
                        </td>
                        <td className="px-3 py-3 text-left text-slate-400 uppercase font-bold text-[9px]">
                          {trip.location || 'N/A'}
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-700">
                          {trip.purpose === 'Custom' ? trip.customPurpose : trip.purpose}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500">{trip.startingKM.toFixed(1)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500">{trip.endingKM.toFixed(1)}</td>
                        <td className="px-3 py-3 text-right font-black text-slate-900">{trip.totalKM.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-right border-t-2 border-slate-900">
                      <td colSpan={6} className="px-3 py-4 uppercase tracking-tighter text-slate-500 text-[11px]">Monthly Total Kilometers</td>
                      <td className="px-3 py-4 text-center bg-indigo-600 text-white text-lg tracking-tighter">{totalKM.toFixed(1)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-3 mt-24">
                <div className="flex flex-col items-center">
                  <div className="w-48 h-[1px] bg-slate-900 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Supplier<br />Signature</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-48 h-[1px] bg-slate-900 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Verifier<br />Signature</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-48 h-[1px] bg-slate-900 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Plant Head<br />Signature</p>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-20 border-t border-slate-100 pt-8 flex justify-between items-center">
                <div className="flex items-center gap-4 grayscale opacity-30">
                   <div className="w-6 h-6 bg-slate-900 rounded" />
                   <p className="text-[8px] font-black uppercase tracking-widest leading-none">RMC Fleet<br />Tracking System</p>
                </div>
                <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">
                  Generated on {format(new Date(), 'dd MMM yyyy • HH:mm:ss')} • Original Document
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
