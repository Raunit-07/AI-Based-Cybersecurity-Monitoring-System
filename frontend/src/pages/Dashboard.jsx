import React from 'react';
import { TrafficChart } from '../components/TrafficChart';
import { AlertsList } from '../components/AlertsList';
import { SuspiciousIPsTable } from '../components/SuspiciousIPsTable';
import { useAlerts, useSuspiciousIPs } from '../hooks/useThreatData';
import { useLiveTraffic } from '../hooks/useLiveTraffic';
import { Shield, AlertTriangle, Activity, Database } from 'lucide-react';


export const Dashboard = () => {
  const { data: alerts, isLoading: isLoadingAlerts } = useAlerts();
  const { data: ips, isLoading: isLoadingIPs } = useSuspiciousIPs();
  const { trafficData, isConnected } = useLiveTraffic();
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const filtered = safeAlerts.filter(a => a.status === 'active' && (a.severity === 'critical' || a.severity === 'high')); 

  const activeThreats = alerts?.filter(a => a.status === 'active').length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' || a.severity === 'high').length || 0;
  const currentRequests = trafficData.length > 0 ? trafficData[trafficData.length - 1].requests : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time threat monitoring and network analysis.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-gray-800 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-danger'}`}></div>
          <span className="text-gray-300">{isConnected ? 'System Online' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Threats" 
          value={activeThreats} 
          icon={<Shield className="w-6 h-6 text-warning" />}
          trend="+2"
          trendColor="text-warning"
        />
        <StatCard 
          title="Critical Alerts" 
          value={criticalAlerts} 
          icon={<AlertTriangle className="w-6 h-6 text-danger" />}
          trend="+1"
          trendColor="text-danger"
        />
        <StatCard 
          title="Live Traffic (req/s)" 
          value={currentRequests} 
          icon={<Activity className="w-6 h-6 text-primary" />}
        />
        <StatCard 
          title="Monitored IPs" 
          value={ips?.length || 0} 
          icon={<Database className="w-6 h-6 text-success" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart data={trafficData} />
        </div>
        <div className="h-[400px]">
          {isLoadingAlerts ? (
            <div className="h-full bg-surface border border-gray-800 rounded-xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AlertsList alerts={alerts} limit={6} />
          )}
        </div>
      </div>

      <div className="w-full">
        {isLoadingIPs ? (
          <div className="h-[300px] bg-surface border border-gray-800 rounded-xl flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <SuspiciousIPsTable ips={ips} />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendColor }) => (
  <div className="bg-surface border border-gray-800 rounded-xl p-6 flex items-start justify-between relative overflow-hidden group">
    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl transition-transform group-hover:scale-150"></div>
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-3">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && <span className={`text-sm font-medium ${trendColor}`}>{trend}</span>}
      </div>
    </div>
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
      {icon}
    </div>
  </div>
);
