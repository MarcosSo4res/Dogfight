import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ImageBackground, Image } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function App() {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const planeXPosition = useSharedValue(Dimensions.get('window').width / 2 - 25);
  const planeYPosition = useSharedValue(Dimensions.get('window').height - 150); // Começa mais acima do fundo
  const [score, setScore] = useState(0);
  const skyOffset = useSharedValue(0);
  const animationRef = useRef(null);

  // Animação do céu vertical (de cima para baixo)
  useEffect(() => {
    const animateSky = () => {
      skyOffset.value = (skyOffset.value + 1) % Dimensions.get('window').height;
      animationRef.current = requestAnimationFrame(animateSky);
    };
    animateSky();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Configuração do giroscópio
  useEffect(() => {
    Gyroscope.setUpdateInterval(16); // ~60fps

    const subscription = Gyroscope.addListener((data) => {
      setGyroData(data);
      
      // Controle horizontal (eixo Y do giroscópio)
      planeXPosition.value = withSpring(
        Math.max(
          0,
          Math.min(
            Dimensions.get('window').width - 50,
            planeXPosition.value - data.y * 20 // Ajuste a sensibilidade aqui
          )
        ),
        { damping: 10, stiffness: 100 }
      );
      
      // Controle vertical (eixo X do giroscópio)
      planeYPosition.value = withSpring(
        Math.max(
          50, // Limite superior
          Math.min(
            Dimensions.get('window').height - 50, // Limite inferior
            planeYPosition.value + data.x * 20 // Ajuste a sensibilidade aqui
          )
        ),
        { damping: 10, stiffness: 100 }
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Estilo animado do avião (horizontal e vertical)
  const planeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: planeXPosition.value },
        { translateY: planeYPosition.value }
      ],
    };
  });

  // Estilo animado do céu (vertical apenas)
  const skyStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: skyOffset.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Camada de fundo azul fixa */}
      <View style={styles.blueBackground} />

      {/* Fundo animado em loop vertical */}
      <Animated.View style={[styles.skyContainer, skyStyle]}>
        <ImageBackground 
          source={require('./assets/sky.png')} 
          style={[styles.skyImage, { height: Dimensions.get('window').height }]}
          resizeMode="cover"
        />
        {/* Segunda imagem imediatamente acima da primeira */}
        <ImageBackground 
          source={require('./assets/sky.png')} 
          style={[styles.skyImage, { 
            height: Dimensions.get('window').height,
            position: 'absolute',
            top: -Dimensions.get('window').height
          }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Área do jogo (sobreposta ao fundo) */}
      <View style={styles.gameArea}>
        <Animated.Image 
          source={require('./assets/plane.png')} 
          style={[styles.plane, planeStyle]}
          resizeMode="contain"
        />
      </View>

      {/* UI sobreposta */}
      <View style={styles.overlay}>
        <Text style={styles.score}>Pontuação: {score}</Text>
        <Text style={styles.instructions}>Incline o dispositivo para controlar o avião</Text>
        <Text style={styles.instructions}>Eixo X: {gyroData.x.toFixed(2)} | Eixo Y: {gyroData.y.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blueBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#3FC2FF',
    zIndex: -2,
  },
  skyContainer: {
    position: 'absolute',
    width: '100%',
    height: Dimensions.get('window').height * 2,
  zIndex: -1,
  },
  skyImage: {
    width: '100%',
    height: '100%',
  },
  gameArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  plane: {
    position: 'absolute',
    width: 60,
    height: 60,
    // Removemos a posição fixa bottom/left pois será controlada pelo animated
  },
  overlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  instructions: {
    fontSize: 16,
    marginTop: 10,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});