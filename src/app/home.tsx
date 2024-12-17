'use client'
import React, { useEffect, useState } from 'react'
import { HeroHighlight } from "@/components/ui/hero-highlight";
import { Highlight } from "@/components/ui/hero-highlight";
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import {
    zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    FileUploader,
    FileUploaderContent,
    FileUploaderItem,
    FileInput,
} from "@/components/ui/extension/file-upload"; // corrected alias
import {
    Switch
} from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowDownToLine, CircleHelp, CloudUpload, Paperclip } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';
import { useGetQuizWithOption, useUploadFile } from '@/queries/useQuiz';
import { IExportOption, QuizList } from '@/interface/quiz';
import { toast } from '@/hooks/use-toast'
import { cn, handleErrorApi } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
const formSchema = z.object({
    uploadedFiles: z.array(z.instanceof(File)).min(1, "Vui lòng chọn file."),
    from: z.string().optional(),
    to: z.string().optional(),
    all: z.boolean().optional(),
});

export default function HomePage() {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<File[] | null>(null);
    const [openGuide, setOpenGuide] = useState(false);
    const [switchChange, setSwitchChange] = useState(false);
    const [data, setData] = useState<QuizList[]>([] as QuizList[]);
    const [dataUpload, setDataUpload] = useState<QuizList[]>([] as QuizList[]);
    const [loading, setLoading] = useState(false);
    const [loadingDownloadBtn, setLoadingDownloadBtn] = useState(false);
    const { mutateAsync } = useUploadFile()
    const GetQuizWithOption = useGetQuizWithOption()
    const steps = [
        {
            title: "Tạo file text",
            description: "Quỳnh tạo file text có đuôi .txt ấy nhé!"
        },
        {
            title: "Copy câu hỏi",
            description: "Copy những câu hỏi vào file text và và đáp án nào đúng thêm dấu - ở đầu đáp án."
        },
        {
            title: "Upload file text",
            description: "Upload file text Quỳnh vừa copy lên nhé, phải upload mới sử dụng được chức năng bên dưới."
        },
        {
            title: "Tạo file excel",
            description: "Quỳnh có thê nhập câu bắt đầu đến câu kết thúc, và 2 giá trị này phải > 0 và <= tổng số câu và câu kết thúc phải lơn hơn câu bắt đầu. Nếu chọn tất cả thì sẽ in ra tất cả."
        },
        {
            title: "Download file excel",
            description: "Mỗi khi nhấn vào tạo danh sách nếu tạo thành công thì Quỳnh án nút tải về bên góc trên phải để tải về ngay danh sách vừa tạo."
        },
    ]
    const dropZoneConfig = {
        maxFiles: 5,
        maxSize: 1024 * 1024 * 4,
        multiple: true,
    };
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),

    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        let res = null
        try {
            console.log(values);
            const data: IExportOption = {
                from: values.from ?? null,
                to: values.to ?? null,
                all: values.all ?? null
            }
            res = await GetQuizWithOption.mutateAsync(data);
            if (res.payload.quizList.length > 0) {
                setLoadingDownloadBtn(true);
                setData(res.payload.quizList);
                toast({
                    title: "Thành công",
                    description: "Lấy dữ liệu với tùy chọn thành công!",
                    duration: 3000,
                    className: cn(
                        'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4'
                    ),

                });

            }
        } catch (error: any) {
            handleErrorApi({
                error,
                setError: form.setError,
                duration: 3000
            })
        } finally {
            setLoadingDownloadBtn(false);
        }
    }
    const handleSwitch = () => {
        setSwitchChange(!switchChange);
        if (switchChange == false) {
            form.setValue("from", '');
            form.setValue("to", '');
        }
    }
    const handleDisableButton = (): boolean => {
        const from = form.getValues("from");
        const to = form.getValues("to");
        const all = form.getValues("all");
        if (from && to && all) {
            return true;
        } else {
            return false;
        }
    }
    const downloadExcel = () => {
        const randomNumber = Math.floor(Math.random() * 1000);
        const dataParse = data.map((item) => {
            return {
                "Question Text": item.questionText,
                "Question Type": item.questionType,
                "Option 1": item.options[0],
                "Option 2": item.options[1],
                "Option 3": item.options[2],
                "Option 4": item.options[3],
                "Correct Answer": item.correctAnswer,
                "Time in seconds": item.duration,
            }
        })
        const headers = ["Question Text", "Question Type", "Option 1", "Option 2", "Option 3", "Option 4", "Correct Answer", "Time in seconds"];
        const worksheet = XLSX.utils.json_to_sheet(dataParse, { header: headers });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `quiz-${randomNumber}.xlsx`);
    }
    const handleUploadFiles = async (files: File[] | null | undefined) => {
        if (!files || files.length === 0) {
            setFiles(null);
            setDataUpload([] as QuizList[]);
            setData([] as QuizList[]);
            form.setValue("from", '');
            form.setValue("to", '');
            form.setValue("all", false);
            return;
        }

        setFiles(files);
        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            setLoading(true);
            const res = await mutateAsync(formData);
            if (res) {
                setDataUpload(res.payload.quizList);
                setLoading(true);
                form.setValue("uploadedFiles", files);
                toast({
                    title: "Thành công",
                    description: "Tải file lên thành công!",
                    duration: 3000,
                    className: cn(
                        'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4'
                    ),

                });
            }
        } catch (error) {
            toast({
                title: "Thất bại",
                description: "Có lỗi xảy ra khi tải file lên.",
                duration: 3000,
                className: cn(
                    'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4'
                ),
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <HeroHighlight>
            <motion.h1
                initial={{
                    opacity: 0,
                    y: 20,
                }}
                animate={{
                    opacity: 1,
                    y: [20, -5, 0],
                }}
                transition={{
                    duration: 0.5,
                    ease: [0.4, 0.0, 0.2, 1],
                }}
                className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
            >
                Mùa xuân đến bình yên
                cho anh những giấc mơ.
                Hạ lưu giữ ngày mưa
                {" "}
                <Highlight className="text-black dark:text-white">
                    ngọt ngào nên thơ
                </Highlight>
            </motion.h1>
            <motion.div
                className="flex justify-center mt-4"
                initial={{
                    opacity: 0,
                    y: 20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.5,
                    ease: [0.4, 0.0, 0.2, 1],
                    delay: 0.3, // Thêm độ trễ để xuất hiện sau header
                }}
            >
                <div className='flex gap-4 items-center'>
                    <Button className='text-base' onClick={() => setOpen(true)} >Bấm vào đây nhé</Button>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <CircleHelp onClick={() => setOpenGuide(true)} />

                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Em quên mất rùi</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>


                </div>
            </motion.div>
            <Dialog open={open} onOpenChange={setOpen}>
                {/* <DialogTrigger asChild>
                    <Button variant="outline">Đã xong</Button>
                </DialogTrigger> */}
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>Xuất file excel</DialogTitle>
                        <DialogDescription>
                            Quỳnh nhớ thực hiện các bước lọc bộ key trược khi tải lên để tránh lỗi nhé!
                        </DialogDescription>
                    </DialogHeader>
                    <div className='flex justify-between items-center'>


                        {
                            loading ? (
                                <Spinner size="sm" className="bg-black dark:bg-white flex justify-items-start" />
                            ) : dataUpload.length > 0 && (
                                <div>
                                    <p className="text-base">Tổng số câu: {dataUpload.length}</p>
                                </div>
                            )
                        }
                        {
                            loadingDownloadBtn ? (
                                <Spinner size="sm" className="bg-black dark:bg-white flex justify-items-start" />
                            ) : (
                                data.length > 0 && (
                                    <div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" onClick={downloadExcel}>
                                                        <ArrowDownToLine />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Tải file excel</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )
                            )
                        }

                    </div>
                    <div className="grid gap-1 py-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 max-w-3xl mx-auto py-3">

                                <FormField
                                    control={form.control}
                                    name="uploadedFiles"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>chọn file</FormLabel>
                                            <FormControl>
                                                <FileUploader
                                                    value={files}

                                                    onValueChange={(newFiles?) => handleUploadFiles(newFiles!)}
                                                    dropzoneOptions={dropZoneConfig}
                                                    className="relative bg-background rounded-lg p-2"
                                                >
                                                    <FileInput
                                                        id="fileInput"
                                                        className="outline-dashed outline-1 outline-slate-500"
                                                    >
                                                        <div className="flex items-center justify-center flex-col p-8 w-full ">
                                                            <CloudUpload className='text-gray-500 w-10 h-10' />
                                                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                                                <span className="font-semibold">Nhấn để tải file lên</span>
                                                                &nbsp; hoặc kéo thả
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                chỉ tải file .txt thui nhé
                                                            </p>
                                                        </div>
                                                    </FileInput>
                                                    <FileUploaderContent>
                                                        {files &&
                                                            files.length > 0 &&
                                                            files.map((file, i) => (
                                                                <FileUploaderItem key={i} index={i}>
                                                                    <Paperclip className="h-4 w-4 stroke-current" />
                                                                    <span className='line-clamp-1'>{file.name}</span>
                                                                </FileUploaderItem>
                                                            ))}
                                                    </FileUploaderContent>
                                                </FileUploader>
                                            </FormControl>
                                            <FormDescription>Chọn file tải lên</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Từ câu</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nhập số câu"
                                                        disabled={switchChange || files === null || dataUpload.length === 0}
                                                        type=""
                                                        {...field} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Đến câu</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nhập số câu"
                                                        disabled={switchChange || files === null || dataUpload.length === 0}
                                                        type=""

                                                        {...field} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                <FormField
                                    control={form.control}
                                    name="all"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Tất cả</FormLabel>
                                                <FormDescription>Xuất tất cả câu hỏi ra file excel</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch onClick={handleSwitch}
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    aria-readonly
                                                    disabled={files === null || dataUpload.length === 0}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {/* <Button type="submit" className='float-right'>Submit</Button> */}
                            </form>
                            <Button disabled={files === null || dataUpload.length === 0} type="submit" form='form' onClick={form.handleSubmit(onSubmit)}>Lấy danh sách</Button>
                        </Form>
                    </div>
                    {/* <DialogFooter>
                        <Button type="submit" form='form' onClick={form.handleSubmit(onSubmit)}>Đã xong</Button>
                    </DialogFooter> */}
                </DialogContent>
            </Dialog>
            <Dialog open={openGuide} onOpenChange={setOpenGuide}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Hướng dẫn chi tiết</DialogTitle>
                        <DialogDescription>
                            Dành cho người hay quên.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {steps.map((step, index) => (
                            <div key={index} className="mb-4">
                                <h3 className="text-lg font-semibold">{`Bước ${index + 1}: ${step.title}`}</h3>
                                <p className="text-sm text-gray-500">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </HeroHighlight>

    )
}
