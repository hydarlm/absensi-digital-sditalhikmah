import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { studentsService } from '@/services/students';
import { cn } from '@/lib/utils';

interface ImportStudentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface ImportResult {
    row: number;
    nis: string;
    name: string;
    class_name: string;
    success: boolean;
    error?: string;
}

export function ImportStudentsDialog({ open, onOpenChange, onSuccess }: ImportStudentsDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<{
        total_rows: number;
        success: number;
        failed: number;
        duplicates: number;
        errors: ImportResult[];
    } | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        // Validate file type
        const validTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (fileExt !== 'csv') {
            toast({
                title: 'File tidak valid',
                description: 'Hanya file CSV yang didukung',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File terlalu besar',
                description: 'Ukuran maksimal file adalah 5MB',
                variant: 'destructive',
            });
            return;
        }

        setSelectedFile(file);
        setImportResults(null);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        try {
            const results = await studentsService.importStudents(selectedFile);
            setImportResults(results);

            if (results.success > 0) {
                toast({
                    title: 'Import berhasil',
                    description: `${results.success} siswa berhasil ditambahkan`,
                });
                onSuccess();
            }

            if (results.failed > 0) {
                toast({
                    title: 'Beberapa data gagal diimport',
                    description: `${results.failed} dari ${results.total_rows} baris gagal diimport`,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal mengimport data',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        studentsService.downloadTemplate();
        toast({
            title: 'Template diunduh',
            description: 'Silakan isi template dengan data siswa',
        });
    };

    const handleClose = () => {
        setSelectedFile(null);
        setImportResults(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Data Siswa</DialogTitle>
                    <DialogDescription>
                        Upload file CSV untuk menambahkan banyak siswa sekaligus
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Download Template Button */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div>
                                        <h4 className="font-semibold">Template CSV</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Download template untuk panduan format data
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* File Upload Zone */}
                    {!importResults && (
                        <Card>
                            <CardContent className="pt-6">
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                        dragActive ? "border-primary bg-primary/5" : "border-muted",
                                        selectedFile ? "bg-muted/50" : ""
                                    )}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {selectedFile ? (
                                        <div className="space-y-4">
                                            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                                            <div>
                                                <p className="font-semibold">{selectedFile.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedFile(null)}
                                            >
                                                Pilih File Lain
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                                            <div>
                                                <p className="font-semibold">Drop file CSV di sini</p>
                                                <p className="text-sm text-muted-foreground">
                                                    atau klik tombol di bawah untuk memilih file
                                                </p>
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    accept=".csv"
                                                    onChange={handleFileInput}
                                                    className="hidden"
                                                />
                                                <label htmlFor="file-upload">
                                                    <Button asChild variant="default">
                                                        <span>Pilih File CSV</span>
                                                    </Button>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedFile && !isImporting && (
                                    <div className="mt-6 flex justify-end">
                                        <Button onClick={handleImport} className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            Mulai Import
                                        </Button>
                                    </div>
                                )}

                                {isImporting && (
                                    <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Mengimport data...</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Import Results */}
                    {importResults && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{importResults.total_rows}</p>
                                        <p className="text-sm text-muted-foreground">Total Baris</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                                        <p className="text-sm text-green-700">Berhasil</p>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                                        <p className="text-sm text-red-700">Gagal</p>
                                    </div>
                                </div>

                                {/* Error Details */}
                                {importResults.failed > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            Detail Error
                                        </h4>
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Baris</TableHead>
                                                        <TableHead>NIS</TableHead>
                                                        <TableHead>Nama</TableHead>
                                                        <TableHead>Kelas</TableHead>
                                                        <TableHead>Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {importResults.errors
                                                        .filter(r => !r.success)
                                                        .map((result, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>{result.row}</TableCell>
                                                                <TableCell>{result.nis}</TableCell>
                                                                <TableCell>{result.name}</TableCell>
                                                                <TableCell>{result.class_name}</TableCell>
                                                                <TableCell className="text-red-600 text-sm">
                                                                    {result.error}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setImportResults(null)}>
                                        Import Lagi
                                    </Button>
                                    <Button onClick={handleClose}>
                                        Selesai
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
