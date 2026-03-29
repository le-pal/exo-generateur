import * as studentRepo from '../repositories/studentRepository.js';

export function listStudents() {
  return studentRepo.findAll();
}

export function getStudent(id) {
  const student = studentRepo.findById(id);
  if (!student) throw Object.assign(new Error('Élève introuvable'), { status: 404 });
  return student;
}

export function createStudent({ name, level }) {
  if (!name?.trim()) throw Object.assign(new Error('Le nom est requis'), { status: 400 });
  return studentRepo.create({ name: name.trim(), level: level ?? '6ème' });
}

export function updateStudent(id, data) {
  getStudent(id); // throws 404 if not found
  return studentRepo.update(id, data);
}

export function deleteStudent(id) {
  getStudent(id); // throws 404 if not found
  studentRepo.remove(id);
}

export function getStudentHistory(studentId) {
  getStudent(studentId); // throws 404 if not found
  return studentRepo.findSessionsByStudentId(studentId);
}
