"use server";
import Answer from "@/database/answer.modal";
import { connectToDatabase } from "../mongoose";
import {
  AnswerVoteParams,
  CreateAnswerParams,
  GetAnswersParams,
} from "./shared.types";
import Question from "@/database/question.modal";
import { revalidatePath } from "next/cache";

export async function createAnswer(params: CreateAnswerParams) {
  try {
    await connectToDatabase();
    const { content, author, question, path } = params;

    const answer = await Answer.create({ content, author, question });
    await Question.findByIdAndUpdate(question, {
      $push: { answers: answer._id },
    });
    revalidatePath(path);
  } catch (error) {
    console.log({ error });
  }
}
export async function getAnswers(params: GetAnswersParams) {
  try {
    await connectToDatabase();
    const { questionId } = params;
    const answers = await Answer.find({ question: questionId })
      .populate("author", "_id clerkId name picture")
      .sort({ createdAt: -1 });
    return { answers };
  } catch (error) {
    console.log({ error });
  }
}

export async function upvoteAnswer(params: AnswerVoteParams) {
  try {
    await connectToDatabase();
    const { userId, answerId, hasupVoted, hasdownVoted, path } = params;

    let updateQuery = {};

    if (hasupVoted) {
      updateQuery = { $pull: { upvotes: userId } };
    } else if (hasdownVoted) {
      updateQuery = {
        $pull: { downvotes: userId },
        $push: { upvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { upvotes: userId } };
    }
    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });

    if (!answer) throw new Error("Question not found");

    revalidatePath(path);
  } catch (error) {
    console.log({ error });
  }
}

export async function downvoteAnswer(params: AnswerVoteParams) {
  try {
    await connectToDatabase();
    const { userId, answerId, hasupVoted, hasdownVoted, path } = params;

    let updateQuery = {};

    if (hasdownVoted) {
      updateQuery = { $pull: { downvotes: userId } };
    } else if (hasupVoted) {
      updateQuery = {
        $pull: { upvotes: userId },
        $push: { downvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { downvotes: userId } };
    }
    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });

    if (!answer) throw new Error("Question not found");

    revalidatePath(path);
  } catch (error) {
    console.log({ error });
  }
}
