import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Printer, CheckCircle2, Clock, XCircle, FileSpreadsheet } from 'lucide-react';
import api from '../api';

const MeetingReportGenerator = () => {
  const [reportType, setReportType] = useState('range'); // 'range', 'single', 'monthly'
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrganizer, setSelectedOrganizer] = useState('all');

  const [meetingsData, setMeetingsData] = useState([]);
  const [organizersList, setOrganizersList] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
    fetchOrganizers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportType, fromDate, toDate, singleDate, selectedMonth, statusFilter, selectedOrganizer, meetingsData]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setMeetingsData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reservations for report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/users');
      const orgs = (res.data || []).filter(u => u.role === 'Organizer' || u.role === 'Admin');
      setOrganizersList(orgs);
    } catch (err) {
      console.error('Failed to fetch organizers list:', err);
    }
  };

  const applyFilters = () => {
    let result = [...meetingsData];

    // Filter by Date Mode
    if (reportType === 'single') {
      result = result.filter(m => m.date === singleDate);
    } else if (reportType === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      result = result.filter(m => {
        if (!m.date) return false;
        const d = new Date(m.date);
        return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
      });
    } else if (reportType === 'range') {
      if (fromDate) result = result.filter(m => m.date >= fromDate);
      if (toDate) result = result.filter(m => m.date <= toDate);
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    // Filter by Specific Organizer
    if (selectedOrganizer !== 'all') {
      result = result.filter(m => m.organizer_id === selectedOrganizer || m.profiles?.id === selectedOrganizer);
    }

    setFilteredMeetings(result);
  };

  // Combine registered organizers + organizers from reservation history
  const organizerMap = new Map();
  organizersList.forEach(u => {
    organizerMap.set(u.id, { id: u.id, name: u.name || u.email, email: u.email });
  });
  meetingsData.forEach(m => {
    if (m.profiles?.id && !organizerMap.has(m.profiles.id)) {
      organizerMap.set(m.profiles.id, { id: m.profiles.id, name: m.profiles.name || m.profiles.email, email: m.profiles.email });
    }
  });
  const allOrganizers = Array.from(organizerMap.values());

  // CSV Export Handler
  const exportToCSV = () => {
    if (filteredMeetings.length === 0) {
      alert('No meeting records to export.');
      return;
    }

    const headers = ['Meeting Title', 'Date', 'Start Time', 'End Time', 'Room Name', 'Location', 'Organizer Name', 'Organizer Email', 'Status'];
    
    const rows = filteredMeetings.map(m => [
      `"${(m.meetings?.[0]?.title || 'Untitled Meeting').replace(/"/g, '""')}"`,
      `"${m.date || ''}"`,
      `"${m.start_time || ''}"`,
      `"${m.end_time || ''}"`,
      `"${(m.rooms?.name || '').replace(/"/g, '""')}"`,
      `"${(m.rooms?.location || '').replace(/"/g, '""')}"`,
      `"${(m.profiles?.name || '').replace(/"/g, '""')}"`,
      `"${(m.profiles?.email || '').replace(/"/g, '""')}"`,
      `"${(m.status || '').toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Meera_Meeting_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export Handler (Styled Printable Document Window)
  const exportToPDF = () => {
    if (filteredMeetings.length === 0) {
      alert('No meeting records to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const dateTitle = reportType === 'single' ? `Date: ${singleDate}` :
                      reportType === 'monthly' ? `Month: ${selectedMonth}` :
                      `Period: ${fromDate} to ${toDate}`;

    const totalApproved = filteredMeetings.filter(m => m.status === 'approved').length;
    const totalPending = filteredMeetings.filter(m => m.status === 'pending').length;
    const totalRejected = filteredMeetings.filter(m => m.status === 'rejected').length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meera Campus Meeting Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
          .header { text-align: center; border-b: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
          .header h3 { margin: 5px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500; }
          .meta-info { display: flex; justify-content: space-between; background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
          .meta-info p { margin: 3px 0; font-size: 13px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .stat-card { background: #f1f5f9; padding: 12px; border-radius: 10px; text-align: center; border: 1px solid #cbd5e1; }
          .stat-card .val { font-size: 22px; font-weight: bold; color: #0f172a; }
          .stat-card .lbl { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #4f46e5; color: white; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; display: inline-block; }
          .badge-approved { background: #dcfce7; color: #15803d; }
          .badge-pending { background: #fef3c7; color: #b45309; }
          .badge-rejected { background: #fee2e2; color: #b91c1c; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Meera Campus Meeting Report</h1>
          <h3>Bannari Amman Institute of Technology — Official Room & Resource Management System</h3>
        </div>

        <div class="meta-info">
          <div>
            <p><strong>Report Filter:</strong> ${reportType.toUpperCase()}</p>
            <p><strong>${dateTitle}</strong></p>
          </div>
          <div style="text-align: right;">
            <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Records:</strong> ${filteredMeetings.length}</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="val">${filteredMeetings.length}</div>
            <div class="lbl">Total Meetings</div>
          </div>
          <div class="stat-card">
            <div class="val" style="color: #15803d;">${totalApproved}</div>
            <div class="lbl">Approved</div>
          </div>
          <div class="stat-card">
            <div class="val" style="color: #b45309;">${totalPending}</div>
            <div class="lbl">Pending</div>
          </div>
          <div class="stat-card">
            <div class="val" style="color: #b91c1c;">${totalRejected}</div>
            <div class="lbl">Rejected</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Meeting Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Room / Venue</th>
              <th>Organizer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMeetings.map((m, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${m.meetings?.[0]?.title || 'Untitled Meeting'}</strong></td>
                <td>${m.date || ''}</td>
                <td>${m.start_time} - ${m.end_time}</td>
                <td>${m.rooms?.name || '-'} (${m.rooms?.location || ''})</td>
                <td>${m.profiles?.name || '-'}<br/><span style="color:#64748b; font-size:10px;">${m.profiles?.email || ''}</span></td>
                <td>
                  <span class="badge badge-${m.status}">
                    ${m.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Confidential Academic Administrative Report — Generated automatically by Meera Management System</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Meeting Reports Generator</h3>
            <p className="text-xs text-slate-500">Filter and download organized meeting reports in CSV or PDF format</p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-medium text-sm transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 font-medium text-sm transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Filter Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Report Mode</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="range">Date Range (From - To)</option>
            <option value="single">Single Specific Date</option>
            <option value="monthly">Monthly Report</option>
          </select>
        </div>

        {/* Dynamic Date Inputs based on Report Type */}
        {reportType === 'range' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {reportType === 'single' && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Date</label>
            <input
              type="date"
              value={singleDate}
              onChange={e => setSingleDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {reportType === 'monthly' && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Month & Year</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Filter by Specific Organizer */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Organizer</label>
          <select
            value={selectedOrganizer}
            onChange={e => setSelectedOrganizer(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 truncate"
          >
            <option value="all">All Organizers ({allOrganizers.length})</option>
            {allOrganizers.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.email})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved Meetings</option>
            <option value="pending">Pending Requests</option>
            <option value="rejected">Rejected Requests</option>
          </select>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-center">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Filtered Meetings</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">{filteredMeetings.length}</p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Approved</p>
          <p className="text-3xl font-black text-emerald-900 mt-1">
            {filteredMeetings.filter(m => m.status === 'approved').length}
          </p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-center">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-black text-amber-900 mt-1">
            {filteredMeetings.filter(m => m.status === 'pending').length}
          </p>
        </div>
        <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-center">
          <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Rejected</p>
          <p className="text-3xl font-black text-red-900 mt-1">
            {filteredMeetings.filter(m => m.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="overflow-hidden border border-slate-100 rounded-2xl">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700 flex justify-between items-center">
          <span>Report Data Preview</span>
          <span className="text-xs font-normal text-slate-500">Showing {filteredMeetings.length} records</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold sticky top-0">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Organizer</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">Loading records...</td></tr>
              ) : filteredMeetings.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">No meeting records found for the selected criteria.</td></tr>
              ) : (
                filteredMeetings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.meetings?.[0]?.title || 'Untitled Meeting'}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      <div>{m.date}</div>
                      <div className="text-slate-400">{m.start_time} - {m.end_time}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{m.rooms?.name || '-'}</div>
                      <div className="text-slate-400 text-xs">{m.rooms?.location || ''}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{m.profiles?.name || '-'}</div>
                      <div className="text-slate-400 text-xs">{m.profiles?.email || ''}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        m.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MeetingReportGenerator;
