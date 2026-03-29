import * as studentRepo from '../repositories/studentRepository.js';
import { AppError } from '../types/index.js';
import type { Student, StudentSessionSummary } from '../types/index.js';

export function listStudents(): Student[] {
  return studentRepo.findAll();
}

export function getStudent(id: number): Student {
  const student = studentRepo.findById(id);
  if (!student) throw new AppError('Élève introuvable', 404);
  return student;
}

export function createStudent({ name, level }: { name?: string; level?: string }): Student {
  if (!name?.trim()) throw new AppError('Le nom est requis', 400);
  return studentRepo.create({ name: name.trim(), level: level ?? '6ème' });
}

export function updateStudent(id: number, data: { name?: string; level?: string }): Student {
  getStudent(id); // throws 404 if not found
  return studentRepo.update(id, data)!;
}

export function deleteStudent(id: number): void {
  getStudent(id); // throws 404 if not found
  studentRepo.remove(id);
}

export function getStudentHistory(studentId: number): StudentSessionSummary[] {
  getStudent(studentId); // throws 404 if not found
  return studentRepo.findSessionsByStudentId(studentId);
}
