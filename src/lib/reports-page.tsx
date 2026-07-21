import { useEffect, useState } from 'react';
import { FileText, Plus, Download, FileSpreadsheet, FileBarChart, FileCheck, Clock } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Button, Badge, Modal, Input, Select, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { formatDate, downloadFile } from './utils';
import type { Report, Organization } from './types';

const reportTypes = [
  { value: 'safety_summary', label: 'Safety Summary', icon: FileBarChart, description: 'Overview of safety incidents and KPIs' },
  { value: 'device_fleet', label: 'Device Fleet Status', icon: FileCheck, description: 'Current status of all devices in fleet' },
  { value: 'alert_analytics', label: 'Alert Analytics', icon: FileBarChart, description: 'Detailed alert analysis with trends' },
  { value: 'compliance', label: 'Compliance Audit', icon: FileCheck, description: 'Regulatory compliance report' },
  { value: 'user_activity', label: 'User Activity', icon: FileText, description: 'User engagement and activity log' },
];

const formatIcons = { pdf: FileText, csv: FileSpreadsheet, excel: FileSpreadsheet };
const formatColors = { pdf: 'red', csv: 'green', excel: 'green' } as const;

export function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const loadData = async () => {
    const [repData, orgData] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }).then((r) => r.data ?? []),
      supabase.from('organizations').select('*').then((r) => r.data ?? []),
    ]);
    setReports(repData as Report[]);
    setOrgs(orgData as Organization[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = (report: Report, format: 'pdf' | 'csv' | 'excel') => {
    let content = '';
    if (format === 'csv') {
      content = `Report Name,Type,Format,Status,Created\n${report.name},${report.type},${report.format},${report.status},${formatDate(report.created_at)}`;
    } else {
      content = `Report: ${report.name}\nType: ${report.type}\nFormat: ${format}\nStatus: ${report.status}\nGenerated: ${formatDate(report.created_at)}\n\nThis is a preview of the generated report.`;
    }
    downloadFile(`${report.name.replace(/\s+/g, '_')}.${format === 'excel' ? 'xls' : format}`, content, format === 'csv' ? 'text/csv' : 'application/octet-stream');
    toast(`Report exported as ${format.toUpperCase()}`, 'success');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Generated Reports</h2>
          <p className="text-xs text-slate-400">{reports.length} reports available</p>
        </div>
        <Button onClick={() => setShowGenerate(true)}><Plus className="h-4 w-4" /> Generate Report</Button>
      </div>

      {/* Report types */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((rt) => {
          const Icon = rt.icon;
          const count = reports.filter((r) => r.type === rt.value).length;
          return (
            <Card key={rt.value} className="p-5 hover:shadow-md transition-shadow cursor-pointer" >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{rt.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rt.description}</p>
                  <p className="text-xs text-slate-500 mt-2">{count} generated</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reports table */}
      <Card>
        <CardHeader title="Report History" subtitle="Recently generated reports" />
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first report to see it here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Report Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((r) => {
                  const FormatIcon = formatIcons[r.format];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                            <FormatIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{r.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4"><Badge color={formatColors[r.format]}>{r.format.toUpperCase()}</Badge></td>
                      <td className="px-6 py-4">
                        <Badge color={r.status === 'completed' ? 'green' : r.status === 'processing' ? 'amber' : 'slate'}>
                          {r.status === 'processing' ? <Clock className="h-3 w-3" /> : <FileCheck className="h-3 w-3" />}
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(r.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPreviewReport(r)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Preview">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleExport(r, 'pdf')} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Export PDF">
                            <Download className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleExport(r, 'csv')} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Export CSV">
                            <FileSpreadsheet className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showGenerate && <GenerateReportModal orgs={orgs} onClose={() => setShowGenerate(false)} onGenerated={() => { setShowGenerate(false); loadData(); }} />}
      {previewReport && <PreviewReportModal report={previewReport} onClose={() => setPreviewReport(null)} onExport={handleExport} />}
    </div>
  );
}

function GenerateReportModal({ orgs, onClose, onGenerated }: { orgs: Organization[]; onClose: () => void; onGenerated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', type: 'safety_summary', format: 'pdf', org: 'all', dateFrom: '', dateTo: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) { toast('Report name is required', 'error'); return; }
    setSaving(true);
    const filters: Record<string, string> = {};
    if (form.org !== 'all') filters.org = form.org;
    if (form.dateFrom) filters.date_from = form.dateFrom;
    if (form.dateTo) filters.date_to = form.dateTo;

    const { error } = await supabase.from('reports').insert({
      name: form.name,
      type: form.type,
      format: form.format,
      filters,
      status: 'completed',
    });
    if (error) { toast('Failed to generate report', 'error'); setSaving(false); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'GENERATE_REPORT',
      entity_type: 'report',
      details: { name: form.name, type: form.type, format: form.format },
    });
    toast('Report generated successfully', 'success');
    setSaving(false);
    onGenerated();
  };

  return (
    <Modal open onClose={onClose} title="Generate Report" size="md">
      <div className="space-y-4">
        <Input label="Report Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly Safety Report" />
        <Select label="Report Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {reportTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
        </Select>
        <Select label="Format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as 'pdf' | 'csv' | 'excel' })}>
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </Select>
        <Select label="Organization" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })}>
          <option value="all">All Organizations</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date From" type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} />
          <Input label="Date To" type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Generating...' : 'Generate Report'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewReportModal({ report, onClose, onExport }: { report: Report; onClose: () => void; onExport: (r: Report, f: 'pdf' | 'csv' | 'excel') => void }) {
  return (
    <Modal open onClose={onClose} title="Report Preview" size="lg">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{report.name}</h3>
              <p className="text-xs text-slate-400">{report.type.replace('_', ' ')} · {report.format.toUpperCase()} · {formatDate(report.created_at)}</p>
            </div>
            <Badge color="green">Completed</Badge>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Report Type</p><p className="text-sm font-medium text-slate-700 capitalize">{report.type.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-slate-400">Format</p><p className="text-sm font-medium text-slate-700">{report.format.toUpperCase()}</p></div>
              <div><p className="text-xs text-slate-400">Generated</p><p className="text-sm font-medium text-slate-700">{formatDate(report.created_at)}</p></div>
              <div><p className="text-xs text-slate-400">Status</p><p className="text-sm font-medium text-slate-700 capitalize">{report.status}</p></div>
            </div>
            {report.filters && (
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Applied Filters</p>
                <pre className="text-xs text-slate-500">{JSON.stringify(report.filters, null, 2)}</pre>
              </div>
            )}
            <div className="rounded-lg bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Report Summary</p>
              <p className="text-sm text-slate-600">
                This report covers the selected period and includes all relevant safety metrics,
                device fleet statistics, and alert analytics. The full report is available for download
                in your selected format.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => onExport(report, report.format)}><Download className="h-4 w-4" /> Download</Button>
        </div>
      </div>
    </Modal>
  );
}
