"use server";

import User from "@/database/user.modal";
import { FilterQuery } from "mongoose";
import { connectToDatabase } from "../mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  UpdateUserParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import Question from "@/database/question.modal";
import Tag from "@/database/tag.model";
import Answer from "@/database/answer.modal";

export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDatabase();
    // const { page = 1, pageSize = 10, filter, searchQuery } = params;
    const users = await User.find({}).sort({ createdAt: -1 });
    return { users };
  } catch (error) {
    console.log({ error });
  }
}

export async function getUserById(params: any) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const user = await User.findOne({ clerkId: userId });
    return user;
  } catch (error) {
    console.log({ error });
  }
}

export async function createUser(userData: CreateUserParams) {
  try {
    await connectToDatabase();
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    console.log({ error });
  }
}

export async function updateUser(params: UpdateUserParams) {
  try {
    await connectToDatabase();
    const { clerkId, updateData, path } = params;
    await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });
    revalidatePath(path);
  } catch (error) {
    console.log({ error });
  }
}

export async function deleteUser(params: DeleteUserParams) {
  try {
    const { clerkId } = params;
    await connectToDatabase();
    const user = await User.findOneAndDelete({ clerkId });

    if (!user) {
      throw new Error("User not found");
    }
    // const userQuestionIds = await Question.find({ author: user._id }).distinct("_id");

    await Question.deleteMany({ author: user._id });

    const deletedUser = await User.findByIdAndDelete(user._id);
    return deletedUser;
  } catch (error) {
    console.log({ error });
  }
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { clerkId, page = 1, pageSize = 10, filter, searchQuery } = params;
    await connectToDatabase();
    const query: FilterQuery<typeof Question> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};
    const user = await User.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: {
        sort: { createdAt: -1 },
      },
      populate: [
        { path: "tags", model: Tag, select: "_id name" },
        { path: "author", model: User, select: "clerkId name picture" },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const savedQuestions = user.saved;
    return { questions: savedQuestions };
  } catch (error) {
    console.log({ error });
  }
}

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    // const { page = 1, pageSize = 10, filter, searchQuery } = params;
    const user = await User.findOne({ clerkId: userId });
    const totalQuestions = await Question.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({
      author: user._id,
    });

    return { user, totalQuestions, totalAnswers };
  } catch (error) {
    console.log({ error });
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  try {
    connectToDatabase();
    // eslint-disable-next-line no-unused-vars
    const { userId, page = 1, pageSize = 10 } = params;

    const totalQuestion = await Question.countDocuments({ author: userId });

    const userQuestions = await Question.find({ author: userId })
      .sort({ views: -1, upvotes: -1 })
      .populate("tags", "_id name")
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      });
    return { questions: userQuestions, totalQuestion };
  } catch (error) {
    console.log({ error });
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    connectToDatabase();
    // eslint-disable-next-line no-unused-vars
    const { userId, page = 1, pageSize = 10 } = params;

    const totalAnswers = await Answer.countDocuments({ author: userId });

    const userAnswers = await Answer.find({ author: userId })
      .sort({ upvotes: -1 })
      .populate("question", "_id title")
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      });
    return { answers: userAnswers, totalAnswers };
  } catch (error) {
    console.log({ error });
  }
}
