import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Film, Sparkles, ChevronRight, ArrowUpRight, Play, Users, Star, Clapperboard } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const POSTERS = [
  "https://images.unsplash.com/photo-1542204118-e69b2d261b48?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1512719263465-429988ce3d19?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=500",
];

const FEATURES = [
  { icon: Sparkles, title: "Dynamic Discovery", desc: "An algorithm that learns your cinematic soul through every frame you love and every director you follow." },
  { icon: Users, title: "Deep Connections", desc: "Build your circle of cinephiles. Discuss, debate, and discover through the people who share your obsession." },
  { icon: Clapperboard, title: "Threaded Discussions", desc: "Start movie discussions, invite your connections, and build conversations that go deeper than any script." },
];

// Fallback Unsplash cinematic images used when TMDB posters fail
// Each entry: correct TMDB poster id + unsplash fallback matching the movie's mood
const CAROUSEL_DIALOGUES = [
  // ── Hollywood ─────────────────────────────────────────────────────────────
  {
    text: "Say hello to my little friend!",
    movie: "Scarface", year: "1983", char: "Tony Montana",
    poster: "https://upload.wikimedia.org/wikipedia/en/8/8e/Scarface_1983_film.jpg",
    fallback: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I'm the king of the world!",
    movie: "Titanic", year: "1997", char: "Jack Dawson",
    poster: "https://upload.wikimedia.org/wikipedia/en/2/22/Titanic_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "My precious.",
    movie: "The Lord of the Rings: The Two Towers", year: "2002", char: "Gollum",
    poster: "https://upload.wikimedia.org/wikipedia/en/a/a1/LOTR_The_Two_Towers.jpg",
    fallback: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "One ring to rule them all.",
    movie: "The Lord of the Rings: The Fellowship of the Ring", year: "2001", char: "Galadriel",
    poster: "https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg",
    fallback: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I am Iron Man.",
    movie: "Iron Man", year: "2008", char: "Tony Stark",
    poster: "https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "Wakanda forever!",
    movie: "Black Panther", year: "2018", char: "T'Challa",
    poster: "https://upload.wikimedia.org/wikipedia/en/4/4b/Black_Panther_film_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "You shall not pass!",
    movie: "The Lord of the Rings: The Fellowship of the Ring", year: "2001", char: "Gandalf",
    poster: "https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg",
    fallback: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I drink your milkshake!",
    movie: "There Will Be Blood", year: "2007", char: "Daniel Plainview",
    poster: "https://upload.wikimedia.org/wikipedia/en/d/d5/There_will_be_blood_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I love the smell of napalm in the morning.",
    movie: "Apocalypse Now", year: "1979", char: "Lt. Kilgore",
    poster: "https://upload.wikimedia.org/wikipedia/en/a/a7/Apocalypse_Now_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500",
  },

  {
    text: "Why did it have to be snakes?",
    movie: "Raiders of the Lost Ark", year: "1981", char: "Indiana Jones",
    poster: "https://upload.wikimedia.org/wikipedia/en/6/6b/Raiders_of_the_lost_ark.jpg",
    fallback: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "Roads? Where we're going, we don't need roads.",
    movie: "Back to the Future", year: "1985", char: "Doc Brown",
    poster: "https://upload.wikimedia.org/wikipedia/en/d/da/Back_to_the_Future.jpg",
    fallback: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "Here's Johnny!",
    movie: "The Shining", year: "1980", char: "Jack Torrance",
    poster: "https://upload.wikimedia.org/wikipedia/en/b/b6/The_Shining_(1980)_film_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "You either die a hero or live long enough to see yourself become the villain.",
    movie: "The Dark Knight", year: "2008", char: "Harvey Dent",
    poster: "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg",
    fallback: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "They may take our lives, but they'll never take our freedom!",
    movie: "Braveheart", year: "1995", char: "William Wallace",
    poster: "https://upload.wikimedia.org/wikipedia/en/e/e5/Braveheart_imp.jpg",
    fallback: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I'm having an old friend for dinner.",
    movie: "The Silence of the Lambs", year: "1991", char: "Hannibal Lecter",
    poster: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg",
    fallback: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I feel the need—the need for speed!",
    movie: "Top Gun", year: "1986", char: "Maverick",
    poster: "https://upload.wikimedia.org/wikipedia/en/a/a8/Top_Gun_Movie.jpg",
    fallback: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "Carpe diem. Seize the day, boys.",
    movie: "Dead Poets Society", year: "1989", char: "John Keating",
    poster: "https://upload.wikimedia.org/wikipedia/en/7/75/Dead_poets_society.jpg",
    fallback: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "This is Sparta!",
    movie: "300", year: "2006", char: "King Leonidas",
    poster: "https://upload.wikimedia.org/wikipedia/en/2/2e/300poster.jpg",
    fallback: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500",
  },
  {
    text: "I'm walking here!",
    movie: "Midnight Cowboy", year: "1969", char: "Ratso Rizzo",
    poster: "https://upload.wikimedia.org/wikipedia/en/8/84/Midnight_Cowboy.jpg",
    fallback: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500",
  }

  // ── Malayalam ─────────────────────────────────────────────────────────────

];
// ── CyclingPosterCard ─────────────────────────────────────────────────────────

const CyclingPosterCard = () => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const posters = [
    { url: "https://image.tmdb.org/t/p/w500/3bhkrj09Vv97p0vYpYv9pAIs67n.jpg", title: "The Godfather", rating: "9.2" },
    { url: "https://image.tmdb.org/t/p/w500/q6y0Go1tsvc2S9S6L7u6q93MvS0.jpg", title: "The Shawshank Redemption", rating: "9.3" },
    { url: "https://image.tmdb.org/t/p/w500/saF3H0Bzb4gho8GA6vxbi86ccRX.jpg", title: "Pulp Fiction", rating: "8.9" },
    { url: "https://image.tmdb.org/t/p/w500/vQ34tYmB8uSDhiBNwnXfwXn9p9v.jpg", title: "Inception", rating: "8.8" },
    { url: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", title: "Interstellar", rating: "8.6" },
    { url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDp9s1vSgZ9RbnvPbK5.jpg", title: "The Dark Knight", rating: "9.0" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setPrev(current);
      setTimeout(() => {
        setCurrent(c => (c + 1) % posters.length);
        setTransitioning(false);
        setPrev(null);
      }, 500);
    }, 3500);
    return () => clearInterval(timer);
  }, [current]);

  const p = posters[current];
  const prevP = prev !== null ? posters[prev] : null;

  return (
    <div className="relative" style={{ width: 300, height: 440 }}>
      <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20 transition-all duration-1000"
        style={{ background: 'radial-gradient(circle, #FFD700, transparent 70%)', transform: 'scale(0.85) translateY(30px)' }} />
      {prevP && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease', zIndex: 1 }}>
          <img src={prevP.url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
        </div>
      )}
      <div className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10"
        style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease', zIndex: 2 }}>
        <img src={p.url} alt={p.title} className="w-full h-full object-cover"
          style={{ transform: transitioning ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s ease' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-[#FFD700]" fill="#FFD700" />
            <span className="text-sm font-black text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.rating} / 10</span>
          </div>
          <div className="text-lg font-black text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{p.title}</div>
        </div>
        <div className="absolute top-5 left-0 right-0 flex justify-center gap-1.5">
          {posters.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-500"
              style={{ width: i === current ? 20 : 6, height: 6, background: i === current ? '#FFD700' : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      </div>
      <div className="float-b absolute glass-gold rounded-2xl px-5 py-3" style={{ bottom: -20, right: -40, zIndex: 10 }}>
        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Top Rated</div>
        <div className="text-base font-black text-white truncate max-w-[140px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{p.title}</div>
      </div>
    </div>
  );
};

// ── DialogueCarousel ──────────────────────────────────────────────────────────

const DialogueCarousel = ({ navigate }) => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const total = CAROUSEL_DIALOGUES.length;

  const go = (next) => {
    if (animating) return;
    setDirection(next > active ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setActive(next);
      setAnimating(false);
    }, 420);
  };

  const goPrev = () => go(active === 0 ? total - 1 : active - 1);
  const goNext = () => go(active === total - 1 ? 0 : active + 1);

  useEffect(() => {
    const t = setInterval(() => {
      const next = active === total - 1 ? 0 : active + 1;
      go(next);
    }, 5000);
    return () => clearInterval(t);
  }, [active, animating]);

  const d = CAROUSEL_DIALOGUES[active];
  const leftIdx = active === 0 ? total - 1 : active - 1;
  const rightIdx = active === total - 1 ? 0 : active + 1;
  const left = CAROUSEL_DIALOGUES[leftIdx];
  const right = CAROUSEL_DIALOGUES[rightIdx];

  // Smart image component: tries TMDB poster, falls back to unsplash
  const PosterImg = ({ src, fallback, alt, className, style }) => (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      style={style}
      onError={e => {
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        }
      }}
    />
  );

  return (
    <section className="py-32 relative overflow-hidden bg-[#080808]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.04), transparent 70%)' }} />

      {/* Heading */}
      <div className="px-6 max-w-7xl mx-auto mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="text-l font-bold uppercase tracking-[0.35em] block mb-3"
            style={{ color: 'rgba(255,215,0,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
            Legends Speak
          </span>
          <h2 className="text-[clamp(3rem,7vw,7rem)] leading-none tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Words That Defined  <span style={{ color: '#FFD700' }}>Cinema</span>
          </h2>
        </motion.div>
      </div>

      {/* Three-card layout */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-5 px-6" style={{ minHeight: 'auto' }}>

        {/* LEFT ghost */}
        <motion.div onClick={goPrev} whileHover={{ scale: 1.03 }}
          className="relative rounded-[1.5rem] overflow-hidden shrink-0 cursor-pointer hidden md:block"
          style={{ width: 200, height: 300, opacity: 0.35, filter: 'blur(1.5px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <PosterImg src={left.poster} fallback={left.fallback} alt={left.movie} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4))' }} />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-sm font-black italic text-white line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              "{left.text}"
            </p>
          </div>
        </motion.div>

        {/* MAIN card */}
        <div className="relative shrink-0 w-full max-w-[340px]" style={{ height: 480 }}>
          <div className="absolute inset-0 rounded-[2rem] blur-2xl opacity-30 scale-90 translate-y-6"
            style={{ background: 'radial-gradient(circle, #FFD700, transparent 70%)' }} />
          <div className="relative rounded-[2rem] overflow-hidden w-full h-full"
            style={{
              border: '1px solid rgba(255,215,0,0.3)',
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${direction * -40}px) scale(0.96)` : 'translateX(0) scale(1)',
              transition: 'opacity 0.38s ease, transform 0.38s ease',
            }}>
            <PosterImg src={d.poster} fallback={d.fallback} alt={d.movie} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)' }} />

            {/* Top badge */}
            <div className="absolute top-5 left-5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', backdropFilter: 'blur(12px)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FFD700' }} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: '#FFD700', fontFamily: "'DM Sans', sans-serif" }}>Iconic Line</span>
              </div>
            </div>

            {/* Counter */}
            <div className="absolute top-5 right-5 text-xs font-black"
              style={{ color: 'rgba(255,215,0,0.4)', fontFamily: "'Bebas Neue', sans-serif" }}>
              {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="text-7xl font-black leading-none mb-1 select-none"
                style={{ color: 'rgba(255,215,0,0.1)', fontFamily: "'Bebas Neue', sans-serif", lineHeight: 0.8 }}>
                &ldquo;
              </div>
              <p className="text-2xl font-black italic text-white leading-snug mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {d.text}
              </p>
              <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] mb-1"
                  style={{ color: 'rgba(255,215,0,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
                  {d.char}
                </div>
                <div className="text-xs font-bold text-gray-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {d.movie} &middot; {d.year}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT ghost */}
        <motion.div onClick={goNext} whileHover={{ scale: 1.03 }}
          className="relative rounded-[1.5rem] overflow-hidden shrink-0 cursor-pointer hidden md:block"
          style={{ width: 200, height: 300, opacity: 0.35, filter: 'blur(1.5px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <PosterImg src={right.poster} fallback={right.fallback} alt={right.movie} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4))' }} />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-sm font-black italic text-white line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              "{right.text}"
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}



      {/* CTA */}

    </section>
  );
};

// ── MarqueeRow ────────────────────────────────────────────────────────────────

const MarqueeRow = ({ items, reverse = false, speed = 40 }) => {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-2">
      <div className="flex gap-3"
        style={{ animation: `${reverse ? 'marquee-rev' : 'marquee-fwd'} ${speed}s linear infinite`, width: 'max-content' }}>
        {doubled.map((url, i) => (
          <div key={i} className="relative shrink-0 group overflow-hidden rounded-2xl" style={{ width: 160, height: 240 }}>
            <img src={url} alt="" loading="lazy"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-700"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Navbar ────────────────────────────────────────────────────────────────────

const Navbar = ({ navigate }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(0,0,0,0.65)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/logo.png" alt="Cinema Kottakam" className="w-10 h-10 md:w-12 md:h-12" />
          <span className="text-lg md:text-xl font-bold tracking-wide text-yellow-400">സിനിമ കൊട്ടക</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/signin')}
            className="px-5 py-2.5 text-sm font-black uppercase tracking-widest text-gray-300 hover:text-gold-text hover:text-shadow-lg transition-colors">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')}
            className="px-5 py-2.5 text-sm font-black uppercase tracking-widest text-gray-300 hover:text-gold-text hover:text-shadow-lg transition-colors">
            Join
          </button>
        </div>
      </div>
    </nav>
  );
};

// ── Landing ───────────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    if (user) {
      const needsOnboarding = !user.selectedGenres || user.selectedGenres.length === 0;
      navigate(needsOnboarding ? '/onboarding/profile-picture' : '/discover');
    }
  }, [user, navigate]);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const posterOpacity = useTransform(scrollYProgress, [0, 0.6], [0.65, 0]);
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, .font-display { font-family: 'Bebas Neue', 'Arial Black', sans-serif; }
        @keyframes marquee-fwd { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-rev { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes float-a { 0%, 100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-16px) rotate(2deg); } }
        @keyframes float-b { 0%, 100% { transform: translateY(0px) rotate(1deg); } 50% { transform: translateY(-10px) rotate(-1deg); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.6); opacity: 0; } }
        .float-a { animation: float-a 7s ease-in-out infinite; }
        .float-b { animation: float-b 9s ease-in-out infinite 1s; }
        .gold { color: #FFD700; }
        .gold-bg { background: linear-gradient(135deg,#FFD700,#B8860B); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border: 1px solid rgba(255,255,255,0.08); }
        .glass-gold { background: rgba(255,215,0,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,215,0,0.18); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #FFD700; border-radius: 2px; }
      `}</style>

      <Navbar navigate={navigate} />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
        <motion.div className="absolute inset-0 z-0 flex flex-col justify-center gap-3 pointer-events-none select-none"
          style={{ opacity: posterOpacity, y: posterY }}>
          <MarqueeRow items={POSTERS} speed={50} />
          <MarqueeRow items={[...POSTERS].reverse()} reverse speed={45} />
          <MarqueeRow items={POSTERS} speed={55} />
        </motion.div>
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 80%, #000 100%)' }} />
        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/noise.png")' }} />
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-24">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-[#FFD700]/60" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#FFD700]/80" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                For Cinephiles
              </span>
            </div>
            <h1 className="text-[clamp(4rem,10vw,9rem)] leading-[0.88] mb-10 tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              YOUR<br />
              <span style={{ WebkitTextStroke: '2px #FFD700', color: 'transparent' }}>CINEMATIC</span><br />
              UNIVERSE
            </h1>
            <p className="text-base md:text-lg text-gray-400 mb-10 leading-relaxed max-w-md"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
              Discover films, rate what you've watched, build your cinephile circle, and dive into discussions that go deeper than any script.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/discover')}
                className="glass flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold uppercase tracking-widest text-sm hover:bg-yellow-500/20 hover:text-yellow-400 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 active:scale-95 group"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Enter Discovery
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/signup')}
                className="glass flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold uppercase tracking-widest text-sm hover:bg-yellow-500/20 hover:text-yellow-400 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 active:scale-95 group"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Join Free
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── DIALOGUES CAROUSEL ── */}
      <DialogueCarousel navigate={navigate} />

      {/* ── FEATURES ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="text-[clamp(2.5rem,8vw,8rem)] leading-[0.88] tracking-tight mb-8 lg:mb-12"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Beyond <span style={{ WebkitTextStroke: '2px #FFD700', color: 'transparent' }}>Watchlists</span>
              </h2>
              <div className="space-y-8">
                {FEATURES.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-5 items-start group">
                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center shrink-0 group-hover:bg-[#FFD700]/10 transition-colors border border-white/10 group-hover:border-[#FFD700]/30">
                      <f.icon className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase italic mb-2 tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {f.title}
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {f.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <div className="max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="rounded-[1.5rem] md:rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(184,134,11,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ background: 'radial-gradient(circle, #FFD700, transparent)' }} />
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
                  style={{ background: 'radial-gradient(circle, #FFD700, transparent)' }} />
                <h2 className="text-[clamp(3rem,8vw,7rem)] leading-none tracking-tight mb-6"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Ready to Discover?
                </h2>
                <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Join thousands of cinephiles exploring, rating, and discussing the best films ever made.
                </p>
                <button onClick={() => navigate('/signup')}
                  className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-black text-base transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#FFD700,#B8860B)', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 0 50px rgba(255,215,0,0.3)' }}>
                  Create Free Account
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="md:col-span-1 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Cinema Kottakam" className="w-12 h-12" />
              <span className="text-xl font-bold tracking-wide text-yellow-400">സിനിമ കൊട്ടക</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The premier destination for film discovery and discussion. Built by cinephiles, for cinephiles.
            </p>
            <div className="flex gap-5">
              {['Twitter', 'Instagram', 'Letterboxd'].map(s => (
                <a key={s} href="#" className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[#FFD700] transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>{s}</a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-3 gap-10">
            {[
              { title: "Navigate", links: ["Discover", "Top Rated", "Upcoming", "Search"] },
              { title: "Community", links: ["Discussions", "Members", "Profiles", "Support"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Licenses"] }
            ].map((sec, i) => (
              <div key={i}>
                <h5 className="text-xs font-black uppercase tracking-widest mb-6 text-[#FFD700]/80" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {sec.title}
                </h5>
                <ul className="space-y-3">
                  {sec.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            © 2026 MovieHub. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;