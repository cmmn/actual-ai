'use client'

import { Text, ScrollView } from 'tamagui'

interface StreamProps {
  response: string
}

export function Stream({ response }: StreamProps) {
  return (
    <ScrollView w={400} maxHeight={400} bg="$background025" p="$3" br="$4" mt="$2">
      <Text color="$color" fontFamily="mono" fontSize="$2" whiteSpace="pre-wrap">
        {response || 'Starting...'}
      </Text>
    </ScrollView>
  )
}