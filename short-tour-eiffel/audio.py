import numpy as np,wave,subprocess
SR=44100;D=805/30;N=int(D*SR);t=np.arange(N)/SR
def wav(p,x):
    x=np.clip(x,-1,1);w=wave.open(p,'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype('<i2').tobytes());w.close()
def env(n,a=0.005,d=0.2):
    k=np.arange(n)/SR;return np.minimum(k/a,1)*np.exp(-k/d)
def put(buf,at,x):
    i=int(at*SR);j=min(N,i+len(x));buf[i:j]+=x[:j-i]
rng=np.random.default_rng(1)
# ---- music: playful accordion-ish waltz until twist (21.3s), then drone
mus=np.zeros(N);bpm=132;beat=60/bpm
prog=[(57,60,64),(62,65,69),(64,68,71),(57,60,64)]
STOP=21.28
k=0;tt=0.0
while tt<STOP:
    bar=int(tt/(beat*3))%4;ch=prog[bar];pos=int(round(tt/beat))%3
    n=int(beat*SR*0.9);kk=np.arange(n)/SR
    if pos==0:
        f=440*2**((ch[0]-12-69)/12);put(mus,tt,0.5*np.sin(2*np.pi*f*kk)*env(n,0.005,0.25))
    else:
        for m in ch:
            f=440*2**((m-69)/12);x=np.sign(np.sin(2*np.pi*f*kk))*0.3+np.sin(2*np.pi*f*1.005*kk)*0.5
            put(mus,tt,0.12*x*env(n,0.01,0.12))
    # melody
    mel=[76,74,72,74,76,76,76,74,74,74,76,79]
    m=mel[k%len(mel)];f=440*2**((m-69)/12);x=(np.sin(2*np.pi*f*kk)+0.4*np.sin(4*np.pi*f*kk))*(1+0.2*np.sin(2*np.pi*6*kk))
    put(mus,tt,0.18*x*env(n,0.02,0.3))
    k+=1;tt+=beat
fade=np.ones(N);i0=int((STOP-0.15)*SR);fade[i0:]=np.maximum(0,1-(np.arange(N-i0)/SR)/0.15);mus*=fade
# drone after stop, then resolve sting on last word
i1=int(STOP*SR);kk=t[i1:]-STOP
mus[i1:]+=0.25*(np.sin(2*np.pi*55*kk)+0.5*np.sin(2*np.pi*82.5*kk))*np.minimum(kk/0.5,1)
# ---- sfx
sfx=np.zeros(N)
def whoosh(at,dur=0.4,g=0.5):
    n=int(dur*SR);x=rng.standard_normal(n);x=np.convolve(x,np.ones(30)/30,'same');put(sfx,at,g*x*np.sin(np.pi*np.arange(n)/n)**2)
def thunk(at,g=0.8,f0=90):
    n=int(0.35*SR);k=np.arange(n)/SR;put(sfx,at,g*np.sin(2*np.pi*f0*k*(1-k))*env(n,0.002,0.08))
def ting(at,f=1760,g=0.4):
    n=int(0.8*SR);k=np.arange(n)/SR;put(sfx,at,g*(np.sin(2*np.pi*f*k)+0.3*np.sin(2*np.pi*f*2.7*k))*env(n,0.002,0.3))
def poof(at,g=0.5):
    n=int(0.5*SR);x=rng.standard_normal(n);put(sfx,at,g*x*env(n,0.01,0.12))
def coins(at,dur,g=0.25):
    for i in range(int(dur*10)):ting(at+i*0.1+rng.random()*0.05,2400+rng.random()*1200,g)
def tick(at,g=0.4):
    n=int(0.04*SR);put(sfx,at,g*rng.standard_normal(n)*env(n,0.001,0.01))
def crash(at,g=0.6):
    n=int(1.0*SR);x=rng.standard_normal(n);x=np.convolve(x,np.ones(8)/8,'same');put(sfx,at,g*x*env(n,0.005,0.35));thunk(at,0.8,60)
def steps(a,b,step=0.27,g=0.35):
    x=a
    while x<b:thunk(x,g,180);x+=step
F=lambda f:f/30
thunk(F(44),0.8);whoosh(F(40),0.3)
thunk(F(100),1.0,70);poof(F(100),0.4)
ting(F(106),2200)
poof(F(146),0.6);ting(F(152),1500)
steps(F(205),F(235))
ting(F(320),900,0.3);coins(F(350),0.7)
crash(F(376));whoosh(F(374),0.6,0.6)
ting(F(426),2600,0.4);ting(F(430),3100,0.3)
whoosh(F(454),0.4);thunk(F(468),0.7,110)
whoosh(F(482),0.9,0.3);ting(F(512),1800,0.3);ting(F(526),2600,0.35)
steps(F(536),F(590),0.17,0.3);whoosh(F(540),0.6)
for i in range(6):tick(F(592)+i*0.5)
whoosh(F(650),0.3,0.3)
whoosh(F(690),0.5,0.6);ting(F(690),1300,0.4)
for i in range(3):whoosh(F(702)+i*0.13,0.15,0.4)
steps(F(737),F(760))
whoosh(F(778),0.3);thunk(F(784),1.0,70);poof(F(784),0.4);ting(F(793),2093,0.5)
wav('music.wav',mus*0.5);wav('sfx.wav',sfx*0.5)
