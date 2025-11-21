'use client'

import { Sheet, YStack, XStack, Text, Button, H2, SizableText } from 'tamagui'
import { useCases, categories } from 'lib'
import { UseCase } from 'types'
import { useState } from 'react'

interface UseCaseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUseCaseId: string
  onUseCaseSelect: (useCase: UseCase) => void
}

export function UseCaseSheet({ open, onOpenChange, currentUseCaseId, onUseCaseSelect }: UseCaseSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredUseCases = selectedCategory
    ? useCases.filter(uc => uc.category === selectedCategory)
    : useCases

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Easy': return '$green9'
      case 'Medium': return '$orange9'
      case 'Hard': return '$red9'
      default: return '$blue9'
    }
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      position={0}
      snapPointsMode="fit"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Handle />

      <Sheet.Frame
        padding="$4"
        gap="$5"
        backgroundColor="$background"
        maxHeight="85vh"
      >
        <YStack gap="$4">
          <H2 textAlign="center" color="$color">
            Select Use Case
          </H2>

          {/* Category Filter */}
          <XStack gap="$2" flexWrap="wrap" jc="center">
            <Button
              size="$3"
              theme={selectedCategory === null ? "active" : undefined}
              onPress={() => setSelectedCategory(null)}
              borderRadius="$10"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                size="$3"
                theme={selectedCategory === category ? "active" : undefined}
                onPress={() => setSelectedCategory(category)}
                borderRadius="$10"
              >
                {category}
              </Button>
            ))}
          </XStack>

          {/* Use Cases Grid */}
          <YStack gap="$3" maxHeight={400} overflow="scroll">
            {filteredUseCases.map((useCase) => (
              <Button
                key={useCase.id}
                onPress={() => {
                  onUseCaseSelect(useCase)
                  onOpenChange(false)
                }}
                theme={currentUseCaseId === useCase.id ? "active" : undefined}
                padding="$4"
                height="auto"
                justifyContent="flex-start"
                borderWidth={2}
                borderColor={currentUseCaseId === useCase.id ? "$color" : "$borderColor"}
              >
                <YStack gap="$2" ai="flex-start" width="100%">
                  <XStack ai="center" gap="$3" width="100%">
                    <Text fontSize="$6">{useCase.icon}</Text>
                    <YStack flex={1} ai="flex-start" gap="$1">
                      <Text fontSize="$5" fontWeight="600" color="$color">
                        {useCase.title}
                      </Text>
                      <Text fontSize="$3" color="$color075" textAlign="left">
                        {useCase.description}
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack gap="$2" ai="center">
                    <SizableText
                      size="$2"
                      backgroundColor={getComplexityColor(useCase.complexity)}
                      color="white"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      {useCase.complexity}
                    </SizableText>
                    <SizableText
                      size="$2"
                      backgroundColor="$color3"
                      color="$color"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      {useCase.category}
                    </SizableText>
                    <SizableText
                      size="$2"
                      backgroundColor="$color2"
                      color="$color"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      {useCase.estimatedTime}
                    </SizableText>
                  </XStack>
                </YStack>
              </Button>
            ))}
          </YStack>

          <Button
            size="$4"
            theme="alt2"
            onPress={() => onOpenChange(false)}
            marginTop="$2"
          >
            Close
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}