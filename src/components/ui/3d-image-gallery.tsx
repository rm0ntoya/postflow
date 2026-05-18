"use client";

import React, {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls, Plane, Sphere } from "@react-three/drei";
import { ArrowLeft, Download, Heart, X } from "lucide-react";
import Link from "next/link";

type Card = {
  id: string;
  imageUrl: string;
  alt: string;
  title: string;
};

type CardContextType = {
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
  cards: Card[];
};

const CardContext = createContext<CardContextType | undefined>(undefined);

function useCard() {
  const context = useContext(CardContext);
  if (!context) throw new Error("useCard must be used within CardProvider");
  return context;
}

function CardProvider({ children }: { children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const cards: Card[] = [
    { id: "1", imageUrl: "/img/viral-27.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Impacto visual" },
    { id: "2", imageUrl: "/img/viral-33.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Cena impossível" },
    { id: "3", imageUrl: "/img/viral-32.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Mistério editorial" },
    { id: "4", imageUrl: "/img/viral-26.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Quebra de padrão" },
    { id: "5", imageUrl: "/img/viral-18.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Reação humana" },
    { id: "6", imageUrl: "/img/viral-30.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Prova visual" },
    { id: "7", imageUrl: "/img/viral-24.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Narrativa em close" },
    { id: "8", imageUrl: "/img/viral-25.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Objeto símbolo" },
    { id: "9", imageUrl: "/img/viral-19.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Tensão silenciosa" },
    { id: "10", imageUrl: "/img/viral-10.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Memória visual" },
    { id: "11", imageUrl: "/img/viral-04.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Luz de descoberta" },
    { id: "12", imageUrl: "/img/viral-08.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Detalhe magnético" },
    { id: "13", imageUrl: "/img/viral-05.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Energia cinética" },
    { id: "14", imageUrl: "/img/viral-38.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Antes e depois" },
    { id: "15", imageUrl: "/img/viral-21.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Atenção imediata" },
    { id: "16", imageUrl: "/img/viral-14.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Construção de desejo" },
    { id: "17", imageUrl: "/img/viral-16.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Ponto de virada" },
    { id: "18", imageUrl: "/img/viral-23.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Imagem gancho" },
    { id: "19", imageUrl: "/img/viral-31.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Conflito visual" },
    { id: "20", imageUrl: "/img/viral-36.jpg", alt: "Imagem viral gerada pelo Carrossel AI", title: "Fechamento forte" },
  ];

  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  );
}

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, sizeAttenuation: true });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    camera.position.z = 10;

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed left-0 top-0 z-0 h-full w-full bg-black" />;
}

function FloatingCard({
  card,
  position,
}: {
  card: Card;
  position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { setSelectedCard } = useCard();

  useFrame(({ camera }) => {
    groupRef.current?.lookAt(camera.position);
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    setSelectedCard(card);
  };
  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (event: any) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        ref={meshRef}
        args={[5.2, 6.4]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.12)" : "scale(1)",
          pointerEvents: "none",
        }}
      >
        <div
          className="h-60 w-48 select-none overflow-hidden rounded-lg bg-[#111113] p-3"
          style={{
            boxShadow: hovered
              ? "0 18px 42px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(198, 248, 78, 0.55)"
              : "0 14px 30px rgba(0, 0, 0, 0.64), 0 0 0 1px rgba(255, 255, 255, 0.10)",
          }}
        >
          <img
            src={card.imageUrl || "/placeholder.svg"}
            alt={card.alt}
            className="h-48 w-full rounded-md bg-black object-contain"
            loading="lazy"
            draggable={false}
          />
          <div className="mt-2 text-center">
            <p className="truncate text-caption font-medium text-white">{card.title}</p>
          </div>
        </div>
      </Html>
    </group>
  );
}

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard();
  const [isFavorited, setIsFavorited] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!selectedCard) return null;

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 18;
    const rotateY = (centerX - x) / 18;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) setSelectedCard(null);
      }}
    >
      <div className="relative mx-4 w-full max-w-md">
        <button
          onClick={() => setSelectedCard(null)}
          className="absolute -top-12 right-0 z-10 text-white transition-colors hover:text-gray-300"
          aria-label="Fechar imagem"
        >
          <X className="h-8 w-8" strokeWidth={1.5} />
        </button>

        <div className="w-full" style={{ perspective: "1000px" }}>
          <div
            ref={cardRef}
            className="relative w-full cursor-pointer rounded-[16px] bg-[#111113] p-4 transition-all duration-500 ease-out"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "rgba(0, 0, 0, 0.34) 0px 28px 70px 0px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative mb-4 w-full" style={{ aspectRatio: "1 / 1" }}>
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-[16px] bg-black object-contain"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
              />
            </div>

            <h3 className="mb-4 text-center text-lg font-semibold text-white">{selectedCard.title}</h3>

            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#C6F84E] text-base font-medium text-black outline-none transition duration-300 ease-out hover:opacity-90 active:scale-[0.97]"
              >
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" strokeWidth={1.8} />
                  <span>Download</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsFavorited((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#C6F84E] text-black outline-none transition duration-300 ease-out hover:opacity-90 active:scale-[0.97]"
                aria-label="Favoritar imagem"
              >
                <Heart className="h-4 w-4" strokeWidth={1.8} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardGalaxy() {
  const { cards } = useCard();

  const cardPositions = useMemo(() => {
    const positions: {
      x: number;
      y: number;
      z: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
    }[] = [];
    const numCards = cards.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < numCards; i++) {
      const y = 1 - (i / (numCards - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / goldenRatio;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const layerRadius = 12 + (i % 3) * 4;

      positions.push({
        x: x * layerRadius,
        y: y * layerRadius,
        z: z * layerRadius,
        rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
        rotationY: Math.atan2(x, z),
        rotationZ: (Math.random() - 0.5) * 0.2,
      });
    }
    return positions;
  }, [cards.length]);

  return (
    <>
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#111113" transparent opacity={0.15} wireframe />
      </Sphere>
      <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#C6F84E" transparent opacity={0.035} wireframe />
      </Sphere>
      <Sphere args={[16, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#C6F84E" transparent opacity={0.024} wireframe />
      </Sphere>
      <Sphere args={[20, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#C6F84E" transparent opacity={0.016} wireframe />
      </Sphere>

      {cards.map((card, index) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[index]} />
      ))}
    </>
  );
}

export default function StellarCardGallerySingle() {
  return (
    <CardProvider>
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <StarfieldBackground />

        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto";
          }}
        >
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <CardGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={40}
              autoRotate={false}
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              panSpeed={0.8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        <div className="pointer-events-none absolute left-4 top-4 z-20 text-white">
          <p className="mb-2 text-micro font-semibold uppercase tracking-[0.18em] text-accent">Modo Viral Ativo</p>
          <h1 className="text-2xl font-bold">Galeria 3D de imagens geradas</h1>
          <p className="mt-2 text-sm text-white/70">Arraste para olhar · Scroll para aproximar · Clique nos cards</p>
        </div>

        <Link
          href="/landing3"
          className="absolute right-4 top-4 z-30 inline-flex h-10 items-center gap-2 rounded-sm border border-white/10 bg-black/60 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Voltar
        </Link>
      </div>
    </CardProvider>
  );
}
