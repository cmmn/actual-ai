import { UseCase, UseCaseContent, ControllerStep } from "types";
import { Header } from "./Header";
import { ModelController } from "./ModelController";
import { useState, useEffect } from "react";
import { useCases } from "lib/useCases";

export function Controller() {
  const [currentUseCase, setCurrentUseCase] = useState<UseCase>(useCases[0]);
  const [showUseCaseSheet, setShowUseCaseSheet] = useState<boolean>(false);
  const [useCaseContent, setUseCaseContent] = useState<UseCaseContent | null>(null);
  const [currentStep, setCurrentStep] = useState<ControllerStep>('selection');

  // Load default use case content on mount
  useEffect(() => {
    loadUseCaseContent(currentUseCase)
  }, [currentUseCase]) // Re-run when currentUseCase changes

  // Load use case content from files
  const loadUseCaseContent = async (useCase: UseCase) => {
    try {
      const [instructionsResponse, contentResponse] = await Promise.all([
        fetch(`/use-cases/${useCase.instructionsFile}`),
        fetch(`/use-cases/${useCase.contentFile}`)
      ])

      const instructions = await instructionsResponse.text()
      const content = await contentResponse.text()

      setUseCaseContent({ instructions, content })
      return { instructions, content }
    } catch (error) {
      console.error('Error loading use case content:', error)
      return null
    }
  }

  // Handle use case selection
  const handleUseCaseSelect = async (useCase: UseCase) => {
    setCurrentUseCase(useCase)
    await loadUseCaseContent(useCase)
    setShowUseCaseSheet(false)
  }

  return (
    <>
      <Header 
        currentUseCase={currentUseCase}
        showUseCaseSheet={showUseCaseSheet}
        handleUseCaseSelect={handleUseCaseSelect}
        setShowUseCaseSheet={setShowUseCaseSheet}
        setCurrentStep={setCurrentStep}
      />
      <ModelController
        useCaseContent={useCaseContent}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
    </>
  )
}