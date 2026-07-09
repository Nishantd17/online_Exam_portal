import TrialRequest from '../models/TrialRequest.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createTrialRequest = async (req, res, next) => {
  try {
    const { fullName, email, subject, message } = req.body;
    if (!fullName || !email || !subject || !message) {
      throw new ApiError(400, 'All fields (fullName, email, subject, message) are required');
    }

    const trialRequest = await TrialRequest.create({
      fullName,
      email,
      subject,
      message
    });

    return res
      .status(201)
      .json(new ApiResponse(201, trialRequest, 'Trial request message sent successfully'));
  } catch (err) {
    next(err);
  }
};

export const getTrialRequests = async (req, res, next) => {
  try {
    const requests = await TrialRequest.find().sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, requests, 'Trial requests retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateTrialRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Reviewed'].includes(status)) {
      throw new ApiError(400, 'Invalid status update value');
    }

    const request = await TrialRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      throw new ApiError(404, 'Trial request not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, request, 'Trial request status updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteTrialRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await TrialRequest.findByIdAndDelete(id);

    if (!request) {
      throw new ApiError(404, 'Trial request not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Trial request deleted successfully'));
  } catch (err) {
    next(err);
  }
};
