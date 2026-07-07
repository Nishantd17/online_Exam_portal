import User from '../models/User.js';
import ExamResponse from '../models/ExamResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ROLES } from '../constants/index.js';

export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'All', sortBy = 'createdAt' } = req.query;

    const query = { role: ROLES.STUDENT, organizationId: req.user.organizationId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'All') {
      query.isActive = status === 'Active';
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortBy]: -1 }
    };

    const skip = (options.page - 1) * options.limit;

    const totalResults = await User.countDocuments(query);
    const students = await User.find(query)
      .sort(options.sort)
      .skip(skip)
      .limit(options.limit);

    // Fetch exams taken and average scores for each student
    const studentData = await Promise.all(
      students.map(async (student) => {
        const responses = await ExamResponse.find({
          student: student._id,
          status: 'submitted'
        });
        
        const examsTaken = responses.length;
        const averageScore = examsTaken
          ? Math.round(responses.reduce((sum, r) => sum + r.percentage, 0) / examsTaken)
          : 0;

        return {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
          phone: student.phone || 'N/A',
          organization: student.organization || 'N/A',
          isActive: student.isActive,
          createdAt: student.createdAt,
          examsTaken,
          averageScore
        };
      })
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          students: studentData,
          total: totalResults,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(totalResults / options.limit)
        },
        'Students fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, 'Full name, email and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Student with this email already exists');
    }

    const student = await User.create({
      fullName,
      email,
      password,
      role: ROLES.STUDENT,
      phone,
      organizationId: req.user.organizationId,
      isVerified: true
    });

    const studentResponse = await User.findById(student._id).select('-password');

    return res
      .status(201)
      .json(new ApiResponse(201, studentResponse, 'Student created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, isActive } = req.body;

    const student = await User.findOneAndUpdate(
      { _id: id, role: ROLES.STUDENT, organizationId: req.user.organizationId },
      { $set: { fullName, phone, isActive } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, student, 'Student updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await User.findOneAndDelete({ _id: id, role: ROLES.STUDENT, organizationId: req.user.organizationId });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Clean up responses
    await ExamResponse.deleteMany({ student: id, organizationId: req.user.organizationId });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Student deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const bulkImport = async (req, res, next) => {
  try {
    const { students } = req.body; // Expecting array of { fullName, email, password, phone }
    
    if (!students || !Array.isArray(students)) {
      throw new ApiError(400, 'Invalid import data format. Expected an array of student objects.');
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const studentData of students) {
      try {
        const { fullName, email, password = 'DefaultPassword123!', phone } = studentData;

        if (!fullName || !email) {
          results.skipped++;
          results.errors.push(`Row missing fullName or email`);
          continue;
        }

        const existing = await User.findOne({ email });
        if (existing) {
          results.skipped++;
          results.errors.push(`Email already exists: ${email}`);
          continue;
        }

        await User.create({
          fullName,
          email,
          password,
          role: ROLES.STUDENT,
          phone,
          organizationId: req.user.organizationId,
          isVerified: true
        });

        results.imported++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Failed to import ${studentData.email}: ${err.message}`);
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, results, `Import finished: ${results.imported} imported, ${results.skipped} skipped.`));
  } catch (error) {
    next(error);
  }
};

export const exportStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: ROLES.STUDENT, organizationId: req.user.organizationId });
    
    let csv = 'Full Name,Email,Phone,Status,Registration Date\n';
    
    students.forEach((s) => {
      csv += `"${s.fullName}","${s.email}","${s.phone || 'N/A'}",${s.isActive ? 'Active' : 'Inactive'},"${s.createdAt.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
