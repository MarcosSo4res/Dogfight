import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ImageBackground, Image } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function App() {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const planePosition = useSharedValue(Dimensions.get('window').width / 2 - 25);
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

  // Configuração do giroscópio (eixo Z para controle radial)
  useEffect(() => {
    Gyroscope.setUpdateInterval(16); // ~60fps

    const subscription = Gyroscope.addListener((data) => {
      setGyroData(data);
      // Usamos o eixo Z para controle radial (girar o celular como volante)
      planePosition.value = withSpring(
        Math.max(
          0,
          Math.min(
            Dimensions.get('window').width - 50,
            planePosition.value - data.z * 20 // Ajuste a sensibilidade aqui
          )
        ),
        { damping: 10, stiffness: 100 }
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Estilo animado do avião (horizontal apenas)
  const planeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: planePosition.value }],
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
        <Text style={styles.instructions}>Gire o dispositivo como um volante para controlar o avião</Text>
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
    backgroundColor: '#3FC2FF', // Cor igual ao céu da sua imagem
    zIndex: -2,
  },
  skyContainer: {
    position: 'absolute',
    width: '100%',
    height: Dimensions.get('window').height * 2, // Dobro da altura para o loop
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
    bottom: 100, // Posição vertical fixa
    left: 0,
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