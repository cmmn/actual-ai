'use client'

import { YStack, XStack, Text, H1, Button, useMedia } from 'tamagui'
import { modelConfigs, allModels } from 'lib'

type ModelKey = 'claude-sonnet-4' | 'claude-3-5-haiku' | 'grok-2' | 'grok-3' | 'grok-4' | 'mixtral-8x7b-instruct-v0-1' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano'


export function ModelSelection({
  selectedModels,
  onSelectedModelsChange,
  onContinue,
}: {
  selectedModels: ModelKey[]
  onSelectedModelsChange: (models: ModelKey[]) => void
  onContinue: () => void
}) {
  const media = useMedia()

  const toggleModel = (modelKey: ModelKey) => {
    if (selectedModels.includes(modelKey)) {
      onSelectedModelsChange(selectedModels.filter(m => m !== modelKey))
    } else {
      onSelectedModelsChange([...selectedModels, modelKey])
    }
  }

  return (
    <YStack
      ai="center"
      p="$6"
      maxWidth={media.gtXs ? 1000 : '100%'}
      width="100%"
    >

      <H1 color="$color" textAlign="center">
        Select Models to Compare
      </H1>

      <Text color="$color" textAlign="center" fontSize="$4">
        {`Choose which AI models you'd like to compare`}
      </Text>

      {/* Model Selection Grid */}
      <XStack gap="$3" mt={40} flexWrap="wrap" jc="center" w="100%">
        {allModels.map((modelKey) => {
          const config = modelConfigs[modelKey]
          const isSelected = selectedModels.includes(modelKey)

          return (
            <Button
              key={modelKey}
              onPress={() => toggleModel(modelKey)}
              theme={isSelected ? 'active' : undefined}
              size="$4"
              br="$4"
              borderWidth={2}
              borderColor={isSelected ? '$color' : '$borderColor'}
              backgroundColor={isSelected ? '$color10' : '$background'}
              color={isSelected ? '$background' : '$color'}
              minWidth={200}
              fontWeight={isSelected ? '700' : '500'}
              hoverStyle={{
                backgroundColor: isSelected ? '$color' : '$backgroundHover',
                borderColor: '$colorHover'
              }}
            >
              {config.displayName}
            </Button>
          )
        })}
      </XStack>

      {/* Selected Count */}
      <Text color="$color075" fontSize="$3" mt={15}>
        {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
      </Text>

      {/* Continue Button */}
      <Button
        size="$5"
        theme={selectedModels.length > 0 ? "active" : undefined}
        onPress={() => {
          onContinue()
        }}
        disabled={selectedModels.length === 0}
        fontWeight="700"
        minWidth={200}
        mt="$4"
        opacity={selectedModels.length === 0 ? 0.5 : 1}
        cursor={selectedModels.length === 0 ? 'not-allowed' : 'pointer'}
        disabledStyle={{
          opacity: 0.5,
          backgroundColor: '$background',
          borderColor: '$borderColor'
        }}
      >
        CONTINUE
      </Button>
    </YStack>
  )
}