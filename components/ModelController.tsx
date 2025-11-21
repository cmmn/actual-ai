'use client'

import { useState } from 'react'
import { YStack } from 'tamagui'
import { ModelSelection } from './ModelSelection'
import { ModelComparison } from './ModelComparison'
import { UseCaseContent } from 'types'
import { ComingSoon } from './ComingSoon'

const IS_LIVE = false

type ModelKey = 'claude-sonnet-4' | 'claude-3-5-haiku' | 'grok-2' | 'grok-3' | 'grok-4' | 'mixtral-8x7b-instruct-v0-1' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano'

type ControllerStep = 'selection' | 'comparison'

export function ModelController({
  useCaseContent,
  currentStep = 'selection',
  setCurrentStep
}: {
  useCaseContent: UseCaseContent | null
  currentStep?: ControllerStep
  setCurrentStep: (step: ControllerStep) => void
}) {
  const [selectedModels, setSelectedModels] = useState<ModelKey[]>([])
  const [showComingSoonAlert, setShowComingSoonAlert] = useState<boolean>(false)

  const handleContinue = () => {

    if (selectedModels.length > 0 && IS_LIVE) {
      setCurrentStep('comparison')
    } else { 
      // trigger coming soon alert
      setShowComingSoonAlert(true)
    }
  }



  return (
    <YStack gap="$5" ai="center">
      {currentStep === 'selection' && (
        <ModelSelection
          selectedModels={selectedModels}
          onSelectedModelsChange={setSelectedModels}
          onContinue={handleContinue}
        />
      )}

      {currentStep === 'comparison' && (
        <ModelComparison
          selectedModels={selectedModels}
          useCaseContent={useCaseContent}
        />
      )}

      {showComingSoonAlert && (
        <ComingSoon
          showUnavailableModal={showComingSoonAlert}
          setShowUnavailableModal={setShowComingSoonAlert}
        />
      )}
    </YStack>
  )
}