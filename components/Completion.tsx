'use client'

import { YStack, Text, XStack, Accordion } from 'tamagui'

interface MCQItem {
  question: string
  options: string[]
  correctOptionIndex: number
  explanation: string
}

interface CompletionProps {
  response: string
}

export function Completion({ response }: CompletionProps) {
  const parseMCQResponse = (rawResponse: string): MCQItem[] => {
    try {
      const parsed = JSON.parse(rawResponse)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const mcqs = parseMCQResponse(response)

  if (mcqs.length === 0) {
    return (
      <YStack gap="$2" p="$3" bg="$background025" br="$4" w={400}>
        <Accordion type="single" collapsible>
          <Accordion.Item value="response-content">
            <Accordion.Trigger flexDirection="row" justifyContent="space-between">
              {({ open }: { open: boolean }) => (
                <>
                  <Text color="$color075" fontSize="$2">Completions</Text>
                  <Text color="$color075" fontSize="$2" transform={[{ rotate: open ? '180deg' : '0deg' }]}>
                    ▼
                  </Text>
                </>
              )}
            </Accordion.Trigger>
            <Accordion.Content>
              <Text color="$color" fontSize="$3">
                {response || 'No response available'}
              </Text>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </YStack>
    )
  }

  return (
    <YStack gap="$2" px="$3" bg="$background025" w={400}>
      <Accordion type="single" collapsible>
        <Accordion.Item value="mcq-results">
          <Accordion.Trigger flexDirection="row" justifyContent="space-between">
            {({ open }: { open: boolean }) => (
              <>
                <Text color="$color075" fontSize="$2">Completion</Text>
                <Text color="$color075" fontSize="$2" transform={[{ rotate: open ? '180deg' : '0deg' }]}>
                  ▼
                </Text>
              </>
            )}
          </Accordion.Trigger>
        <Accordion.Content>
          <YStack gap="$4">
            {mcqs.map((mcq, index) => (
              <YStack key={index} gap="$3" p="$2" bg="$background050" br="$4">
                {/* Question */}
                <Text color="$color" fontSize="$4" fontWeight="bold">
                  Question {index + 1}: {mcq.question}
                </Text>

                {/* Options */}
                <YStack gap="$2">
                  {mcq.options && Array.isArray(mcq.options) ? (
                    mcq.options.map((option, optionIndex) => {
                      const letter = String.fromCharCode(65 + optionIndex)
                      const isCorrect = optionIndex === mcq.correctOptionIndex

                      return (
                        <XStack key={optionIndex} gap="$2" ai="flex-start">
                          <Text
                            color={isCorrect ? "$green10" : "$red9"}
                            fontSize="$3"
                            fontWeight="500"
                            minWidth="$2"
                          >
                            {letter}.
                          </Text>
                          <Text
                            color={isCorrect ? "$green10" : "$red9"}
                            fontSize="$3"
                            flex={1}
                          >
                            {option} {isCorrect && '✓'}
                          </Text>
                        </XStack>
                      )
                    })
                  ) : (
                    <Text color="$red9" fontSize="$3">
                      Invalid options format
                    </Text>
                  )}
                </YStack>

                {/* Explanation */}
                <YStack gap="$1">
                  <Text color="$color" fontSize="$3" fontWeight="500">
                    Explanation:
                  </Text>
                  <Text color="$color075" fontSize="$3" lineHeight="$1">
                    {mcq.explanation}
                  </Text>
                </YStack>
              </YStack>
            ))}
          </YStack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
    </YStack>
  )
}