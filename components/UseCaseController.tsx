'use client'

import { useState } from 'react'
import { UseCase } from 'types'
import { UseCaseSelection } from './UseCaseSelection'

interface UseCaseControllerProps {
  onContinue: (useCase: UseCase, content: {instructions: string, content: string}) => void
  onBack: () => void
  isAvailable: boolean | null
  onUnavailable: () => void
}

export function UseCaseController({ onContinue, onBack, isAvailable, onUnavailable }: UseCaseControllerProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  // Load use case content when selected
  const loadUseCaseContent = async (useCase: UseCase) => {
    setLoading(true)
    try {
      const [instructionsResponse, contentResponse] = await Promise.all([
        fetch(`/use-cases/${useCase.instructionsFile}`),
        fetch(`/use-cases/${useCase.contentFile}`)
      ])

      const instructionsText = await instructionsResponse.text()
      const contentText = await contentResponse.text()

      setInstructions(instructionsText)
      setContent(contentText)
    } catch (error) {
      console.error('Error loading use case content:', error)
      setInstructions('')
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  // Handle use case selection
  const handleUseCaseSelect = (useCase: UseCase) => {
    setSelectedUseCase(useCase)
    setCustomMode(false)
    loadUseCaseContent(useCase)
  }

  // Handle custom mode
  const handleCustomMode = () => {
    setSelectedUseCase(null)
    setCustomMode(true)
    setInstructions('')
    setContent('')
  }

  // Handle continue
  const handleContinue = () => {
    if (!isAvailable) {
      onUnavailable()
      return
    }

    if (instructions.trim() && content.trim()) {
      const useCase = selectedUseCase || {
        id: 'custom',
        title: 'Custom Use Case',
        description: 'User-defined instructions and content',
        category: 'Custom',
        instructionsFile: '',
        contentFile: '',
        icon: '⚡',
        complexity: 'Medium' as const,
        estimatedTime: 'Variable'
      }

      onContinue(useCase, { instructions: instructions.trim(), content: content.trim() })
    }
  }

  return (
    <UseCaseSelection
      selectedUseCase={selectedUseCase}
      selectedCategory={selectedCategory}
      customMode={customMode}
      instructions={instructions}
      content={content}
      loading={loading}
      onUseCaseSelect={handleUseCaseSelect}
      onCustomMode={handleCustomMode}
      onInstructionsChange={setInstructions}
      onContentChange={setContent}
      onCategoryChange={setSelectedCategory}
      onContinue={handleContinue}
      onBack={onBack}
    />
  )
}