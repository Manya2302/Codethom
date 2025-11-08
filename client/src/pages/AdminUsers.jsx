import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import UserManagementTable from '@/components/UserManagementTable';
import AddAdminModal from '@/components/AddAdminModal';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (window.refreshUserTable) {
      window.refreshUserTable();
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">View and manage all users in the system.</p>
          </div>
          <Button onClick={() => setShowAddAdminModal(true)} data-testid="button-open-add-admin">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </div>
        <UserManagementTable key={refreshKey} onRefresh={handleRefresh} />
      </div>
      {showAddAdminModal && (
        <AddAdminModal 
          onClose={() => { 
            setShowAddAdminModal(false); 
            handleRefresh();
          }} 
        />
      )}
    </DashboardLayout>
  );
}

