'use client'

import { Text, ScrollView, View } from 'tamagui'
import { useEffect, useRef } from 'react'

interface StreamProps {
  response: string
}

export function Stream({ response }: StreamProps) {
  const scrollViewRef = useRef<ScrollView>(null)

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true })
    }
  }, [response])

  return (
    <View position="relative" w={400} maxHeight={150} bg="$background025" br="$4" mt="$2" overflow="hidden">
      <ScrollView
        ref={scrollViewRef}
        p="$3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: '$6' }}
      >
        <Text color="$color" fontFamily="$body" fontSize="$2" whiteSpace="pre-wrap" lineHeight="$1">
          {response || 'Starting...'}
        </Text>
      </ScrollView>

      {/* Gradient fade at the bottom */}
      <View
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={60}
        pointerEvents="none"
        style={{
          background: 'linear-gradient(to top, var(--background025) 0%, transparent 100%)'
        }}
      />
    </View>
  )
}