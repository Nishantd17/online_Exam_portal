import Question from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createQuestion = async (req, res, next) => {
  try {
    const questionData = req.body;
    questionData.createdBy = req.user._id;

    if (!questionData.text || !questionData.type || !questionData.difficulty || !questionData.category) {
      throw new ApiError(400, 'Required fields missing: text, type, difficulty, category');
    }

    const question = await Question.create(questionData);

    return res
      .status(201)
      .json(new ApiResponse(201, question, 'Question created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type,
      difficulty,
      category,
      topic
    } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (type) {
      query.type = type;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (topic) {
      query.topics = { $in: [topic] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          questions,
          total,
          page: parseInt(page),
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        'Questions retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, question, 'Question details fetched'));
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, question, 'Question updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Question deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const bulkImportQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      throw new ApiError(400, 'Invalid import data format. Expected array.');
    }

    const formattedQuestions = questions.map((q) => ({
      ...q,
      createdBy: req.user._id
    }));

    const importedQuestions = await Question.insertMany(formattedQuestions);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { count: importedQuestions.length },
          `${importedQuestions.length} questions imported successfully`
        )
      );
  } catch (error) {
    next(error);
  }
};
