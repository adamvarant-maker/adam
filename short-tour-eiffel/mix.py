import numpy as np,subprocess,sys,wave
SR=44100
def load(p):
    r=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout;return np.frombuffer(r,np.float32).astype(np.float64)
v=load('voice.mp3');m=load('music.wav');s=load('sfx.wav')
N=len(v);m=np.pad(m,(0,max(0,N-len(m))))[:N];s=np.pad(s,(0,max(0,N-len(s))))[:N]
def grms(x):
    b=x[:len(x)//2205*2205].reshape(-1,2205);r=np.sqrt((b**2).mean(1));thr=r.max()*10**(-40/20);r=r[r>thr];return np.sqrt((r**2).mean())
vr=grms(v)
m*=0.5*vr/grms(m)
s*=0.5*vr/grms(s)
pk=0.7*np.abs(v).max()
if np.abs(s).max()>pk: s*=pk/np.abs(s).max()
db=lambda a,b:20*np.log10(grms(a)/grms(b))
print(f"music vs voice: {db(m,v):.1f} dB   sfx vs voice: {db(s,v):.1f} dB")
x=v+m+s
w=wave.open('mix.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes());w.close()
