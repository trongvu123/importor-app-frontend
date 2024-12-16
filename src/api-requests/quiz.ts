import { IExportOption, IQuizList } from "@/interface/quiz";
import http from "@/lib/http";

const quizApiRequests = {
    upload: (formData: FormData) => http.post<IQuizList>('upload-quiz', formData),
    getDataOption: (body: IExportOption) => http.post<IQuizList>('export-option', body)
}

export default quizApiRequests