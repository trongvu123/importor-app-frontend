import quizApiRequests from '@/api-requests/quiz'
import { useMutation, useQuery } from '@tanstack/react-query'
export const useUploadFile = () => {
    return useMutation({
        mutationFn: quizApiRequests.upload
    })
}
export const useGetQuizWithOption = () => {
    return useMutation({
        mutationFn: quizApiRequests.getDataOption
    })
}