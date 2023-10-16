"use server";

import Tag from "@/database/tag.model";

import { connectToDatabase } from "../mongoose";
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from "./shared.types";
import User from "@/database/user.modal";
import { FilterQuery } from "mongoose";
import Question from "@/database/question.modal";

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
  try {
    await connectToDatabase();
    // const { page = 1, pageSize = 10, filter, searchQuery } = params;
    const { userId } = params;

    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    return [
      { _id: "1", name: "tag1" },
      { _id: "2", name: "tag2" },
    ];
  } catch (error) {
    console.log({ error });
  }
}

export async function getAllTags(params: GetAllTagsParams) {
  try {
    await connectToDatabase();
    const tags = await Tag.find({});
    return { tags };
  } catch (error) {
    console.log({ error });
  }
}

export async function getQuestionsByTagId(params: GetQuestionsByTagIdParams) {
  try {
    await connectToDatabase();
    // eslint-disable-next-line no-unused-vars
    const { tagId, page = 1, pageSize = 10, searchQuery } = params;

    const tagFilter: FilterQuery<typeof Tag> = { _id: tagId };
    const tag = await Tag.findOne(tagFilter).populate({
      path: "questions",
      model: Question,
      match: searchQuery
        ? { title: { $regex: searchQuery, $options: "i" } }
        : {},
      options: {
        sort: { createdAt: -1 },
      },
      populate: [
        { path: "tags", model: Tag, select: "_id name" },
        { path: "author", model: User, select: "clerkId name picture" },
      ],
    });

    if (!tag) {
      throw new Error("Tag not found");
    }
    const questions = tag.questions;

    return { tagTitle: tag.name, questions };
  } catch (error) {
    console.log({ error });
  }
}
