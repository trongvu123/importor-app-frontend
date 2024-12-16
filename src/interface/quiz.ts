export interface IQuizList {
    quizList: QuizList[];
    total: number;
    message?: string
}

export interface QuizList {
    questionText: string;
    options: string[];
    correctAnswer: number;
    questionType: QuestionType;
    duration: number;
}

export enum QuestionType {
    MultipleChoice = "Multiple Choice",
}
export interface IExportOption {
    from: string | null,
    to: string | null,
    all: boolean | null,
}