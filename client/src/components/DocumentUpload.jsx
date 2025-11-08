import { useState } from 'react';
import { Upload, File, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DocumentUpload() {
  const [files, setFiles] = useState([
    { id: 1, name: 'passport.pdf', type: 'PDF', size: '2.4 MB', status: 'verified' },
    { id: 2, name: 'license.jpg', type: 'Image', size: '1.8 MB', status: 'pending' },
    { id: 3, name: 'contract.pdf', type: 'PDF', size: '3.2 MB', status: 'rejected' },
  ]);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const newFiles = uploadedFiles.map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      type: file.type.includes('pdf') ? 'PDF' : 'Image',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      status: 'pending',
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDelete = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { icon: CheckCircle, variant: 'default', label: 'Verified', className: 'bg-green-600 dark:bg-green-700' },
      pending: { icon: Clock, variant: 'secondary', label: 'Pending', className: 'bg-yellow-600 dark:bg-yellow-700' },
      rejected: { icon: XCircle, variant: 'destructive', label: 'Rejected', className: 'bg-red-600 dark:bg-red-700' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card data-testid="card-document-upload">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="border-2 border-dashed rounded-xl min-h-48 flex flex-col items-center justify-center p-6 hover-elevate transition-colors"
          data-testid="dropzone-upload"
        >
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-2">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG up to 10MB</p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            data-testid="input-file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild data-testid="button-select-files">
              <span>Select Files</span>
            </Button>
          </label>
        </div>

        {files.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} data-testid={`row-file-${file.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        {file.name}
                      </div>
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id)}
                        data-testid={`button-delete-${file.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
