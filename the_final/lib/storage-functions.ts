import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "./config"

export async function uploadAssessmentImage(
  userId: string,
  assessmentId: string,
  file: File,
  roomIndex: number,
): Promise<string> {
  const fileExtension = file.name.split(".").pop() || "jpg"
  const fileName = `${roomIndex}-${Date.now()}.${fileExtension}`
  const filePath = `assessments/${userId}/${assessmentId}/${fileName}`

  const storageRef = ref(storage, filePath)
  await uploadBytes(storageRef, file)

  return getDownloadURL(storageRef)
}

export async function uploadVisualization(
  userId: string,
  assessmentId: string,
  imageData: string,
  roomIndex: number,
): Promise<string> {
  const fileName = `visualization-${roomIndex}-${Date.now()}.png`
  const filePath = `assessments/${userId}/${assessmentId}/visualizations/${fileName}`

  // Convert base64 to blob
  const response = await fetch(`data:image/png;base64,${imageData}`)
  const blob = await response.blob()

  const storageRef = ref(storage, filePath)
  await uploadBytes(storageRef, blob)

  return getDownloadURL(storageRef)
}

export async function deleteAssessmentFiles(userId: string, assessmentId: string, filePaths: string[]): Promise<void> {
  await Promise.all(
    filePaths.map(async (path) => {
      try {
        const storageRef = ref(storage, path)
        await deleteObject(storageRef)
      } catch (error) {
        console.error(`Failed to delete file: ${path}`, error)
      }
    }),
  )
}
