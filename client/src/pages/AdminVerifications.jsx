import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/verifications?status=pending');
      if (response.ok) {
        const data = await response.json();
        setVerifications(data);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to load verifications',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending verifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'RERA ID copied to clipboard',
    });
  };

  const handleApprove = async (verification) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/verifications/${verification._id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${verification.name}'s account has been approved and activated.`,
        });
        fetchVerifications();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to approve verification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve verification',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    submitRejection();
  };

  const submitRejection = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/verifications/${selectedVerification._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${selectedVerification.name}'s verification has been rejected.`,
        });
        setShowRejectDialog(false);
        setSelectedVerification(null);
        setRejectionReason('');
        fetchVerifications();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to reject verification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject verification',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (verification) => {
    setSelectedVerification(verification);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading verifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Pending Verifications</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve or reject vendor/broker account applications
        </p>
      </div>

      {verifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Verifications</h3>
            <p className="text-muted-foreground text-center max-w-md">
              All verification requests have been processed. New requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <Card key={verification._id} data-testid={`card-verification-${verification._id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl" data-testid={`text-name-${verification._id}`}>
                      {verification.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <span data-testid={`text-email-${verification._id}`}>{verification.email}</span>
                      <span className="mx-2">•</span>
                      <Badge variant="secondary" data-testid={`badge-role-${verification._id}`}>
                        {verification.role.charAt(0).toUpperCase() + verification.role.slice(1)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap" data-testid={`badge-status-${verification._id}`}>
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">RERA ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-muted px-3 py-1 rounded-md text-sm font-mono flex-1" data-testid={`text-reraid-${verification._id}`}>
                        {verification.reraId}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(verification.reraId)}
                        data-testid={`button-copy-${verification._id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                        data-testid={`button-verify-${verification._id}`}
                      >
                        <a
                          href="https://gujrera.gujarat.gov.in/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Submitted</Label>
                    <p className="text-sm mt-1" data-testid={`text-submitted-${verification._id}`}>
                      {formatDate(verification.submittedAt)}
                    </p>
                  </div>

                  {verification.phone && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Phone</Label>
                      <p className="text-sm mt-1" data-testid={`text-phone-${verification._id}`}>
                        {verification.phone}
                      </p>
                    </div>
                  )}

                  {verification.company && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Company</Label>
                      <p className="text-sm mt-1" data-testid={`text-company-${verification._id}`}>
                        {verification.company}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(verification)}
                    disabled={actionLoading}
                    className="flex-1"
                    data-testid={`button-approve-${verification._id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog(verification)}
                    disabled={actionLoading}
                    className="flex-1"
                    data-testid={`button-reject-${verification._id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request. This will be sent to the applicant via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this verification is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
                data-testid="textarea-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
              data-testid="button-submit-reject"
            >
              {actionLoading ? 'Submitting...' : 'Submit Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
