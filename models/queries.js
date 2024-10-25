const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email: email },
  });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id: id },
  });
};

const addUser = async (email, password) => {
  return await prisma.user.create({
    data: {
      email,
      password,
    },
  });
};

const createFolder = async (name, userId) => {
  return await prisma.folder.create({
    data: {
      name,
      userId,
    },
  });
};

// Read (get) a folder by ID
const getFolderById = async (id) => {
  return await prisma.folder.findUnique({
    where: { id },
  });
};

const getFolder = async (name) => {
  return await prisma.folder.findFirst({
    where: { name },
  });
};

// Read (get) all folders for a specific user
const getFoldersByUserId = async (userId) => {
  return await prisma.folder.findMany({
    where: { userId },
  });
};

// Update a folder by ID
const updateFolder = async (id, newName) => {
  return await prisma.folder.update({
    where: {
      id: id,
    },
    data: {
      name: newName,
    },
  });
};

// Delete a folder by ID
const deleteFolder = async (id) => {
  return await prisma.folder.delete({
    where: { id },
  });
};

// Create a new file
const createFile = async (name, size, folderId = null, userId, fileUrl) => {
  return await prisma.file.create({
    data: {
      name,
      size,
      folderId,
      userId,
      fileUrl,
    },
  });
};

// Read (get) a file by ID
const getFileById = async (id) => {
  return await prisma.file.findUnique({
    where: { id },
  });
};

// Read (get) all files for a specific user
const getFilesByUserId = async (userId) => {
  return await prisma.file.findMany({
    where: { userId },
  });
};

// Read (get) all files in a specific folder
const getFilesByFolderId = async (folderId) => {
  return await prisma.file.findMany({
    where: { folderId },
  });
};

const getFilesWithNoFolder = async (userid) => {
  return await prisma.file.findMany({
    where: { folderId: null, userId: userid },
  });
};

// Delete a file by ID
const deleteFile = async (id) => {
  return await prisma.file.delete({
    where: { id },
  });
};

module.exports = {
  getUserByEmail,
  getUserById,
  addUser,
  createFolder,
  getFolder,
  getFolderById,
  getFoldersByUserId,
  updateFolder,
  deleteFolder,
  createFile,
  getFileById,
  getFilesByUserId,
  getFilesByFolderId,
  getFilesWithNoFolder,
  deleteFile,
};
