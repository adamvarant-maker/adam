import re,json
sil=[(2.60,2.88),(3.71,4.01),(6.43,6.72),(9.23,9.52),(12.12,12.44),(13.31,13.56),(15.59,15.86),(17.88,18.09),(19.47,19.73),(20.98,21.28),(22.98,23.19),(23.58,23.79),(24.56,24.77),(25.60,25.90),(26.51,26.80)]
segs=[];t=0.0
for a,b in sil: segs.append((t,a)); t=b
ph=["En 1925, un homme a vendu la tour Eiffel.","Et il a recommencé.","Victor Lustig se fait passer pour un haut fonctionnaire.","Dans un grand hôtel parisien,","il réunit des ferrailleurs.","Son secret d'État :","la tour rouille,","elle coûte une fortune,","Paris va la démonter.","Un certain André Poisson y croit.","Il paie le prix…","et même un pot-de-vin,","pour être sûr de l'avoir.","Lustig file avec la valise.","Mais la police ne vient jamais.","Poisson avait trop honte pour porter plainte.","Alors, un mois plus tard,","Lustig est revenu.","Pour la revendre."]
def syl(s):
    s=s.lower().replace("1925","mille neuf cent vingt cinq")
    return len(re.findall(r"[aeiouyéèêàâôûîœ]+",s))
S=[syl(p) for p in ph]; tot=sum(S); spd=sum(b-a for a,b in segs)/tot
# DP: assign contiguous phrase groups to contiguous segment groups (each segment boundary must be phrase boundary)
import functools
n,m=len(ph),len(segs)
@functools.lru_cache(None)
def f(i,j):
    if i==n and j==m: return (0,[])
    if i==n or j==m: return (1e9,[])
    best=(1e9,[])
    for i2 in range(i+1,n+1):
        for j2 in range(j+1,m+1):
            d=segs[j2-1][1]-segs[j][0]; e=sum(S[i:i2])*spd
            c=(d-e)**2 + 0.3*(j2-j-1)
            # penalise sentence ends inside a group
            c+=0.5*sum(1 for k in range(i,i2-1) if ph[k].endswith(('.',':')))
            r=f(i2,j2)
            if c+r[0]<best[0]: best=(c+r[0],[(i,i2,j,j2)]+r[1])
    return best
c,g=f(0,0)
out=[]
for i,i2,j,j2 in g:
    print(f"{segs[j][0]:6.2f}-{segs[j2-1][1]:6.2f}  "+" ".join(ph[i:i2]))
    out.append(dict(t0=segs[j][0],t1=segs[j2-1][1],text=" ".join(ph[i:i2])))
json.dump(out,open("phrases.json","w"),ensure_ascii=False,indent=1)
