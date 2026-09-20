# Paleta = la de la plataforma (public/index.html :root): bg #07160F, surface #0E2B1E,
# border #1F4D36, teal #35C06F, blue #1FB6A6, grad 1FB6A6→35C06F→7BE08A. Texto EAF5EE.
C='#B8733A'; C2='#8E5124'; C3='#6A3A17'; CR='#EAD7B2'; G='#E0A93C'; K='#0A0806'
V='#35C06F'; V2='#1FB6A6'; V3='#7BE08A'
def logo(size=200, uid='a', mono=None, hoja=True, bg='#0E2B1E'):
    if mono:
        C2_=C3_=CR_=mono; K_=bg
        body=f'fill="{mono}"'
        hoja_svg=(f'<path d="M6 178 C40 150, 100 136, 150 130 C176 127, 190 124, 196 118 C186 140, 160 156, 126 162 C88 168, 40 176, 6 178 Z" fill="{mono}" opacity="0.28"/>') if hoja else ''
        saco=f'<circle cx="124" cy="116" r="23" fill="{bg}" stroke="{mono}" stroke-width="5"/>'
        vientre=''; linea=''
        ojo=f'<circle cx="150" cy="74" r="13" fill="{bg}"/><circle cx="150" cy="74" r="6.5" fill="{mono}"/>'
        ondas=f'<path d="M180 58 C186 50, 188 40, 186 30" fill="none" stroke="{mono}" stroke-width="6.5" stroke-linecap="round"/><path d="M192 70 C200 58, 202 44, 198 28" fill="none" stroke="{mono}" stroke-width="6.5" stroke-linecap="round" opacity="0.5"/>'
    else:
        C2_=C2;C3_=C3;CR_=CR;K_=K
        body=f'fill="url(#b{uid})"'
        # hoja real: lámina con gradiente de la plataforma + nervio central claro
        hoja_svg=(f'<path d="M6 178 C40 150, 100 136, 150 130 C176 127, 190 124, 196 118 C186 140, 160 156, 126 162 C88 168, 40 176, 6 178 Z" fill="url(#h{uid})"/>'
                  f'<path d="M12 174 C60 158, 120 146, 190 122" fill="none" stroke="{V3}" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>') if hoja else ''
        saco=f'<circle cx="124" cy="116" r="23" fill="{CR}"/>'
        vientre=f'<path d="M62 118 C88 124, 118 118, 148 104 C132 118, 100 126, 74 122 Z" fill="{CR}" opacity="0.92"/>'
        linea=f'<path d="M72 74 C102 62, 138 62, 168 76" fill="none" stroke="{CR}" stroke-width="3.5" stroke-linecap="round"/>'
        ojo=f'<circle cx="150" cy="74" r="14" fill="{K}"/><circle cx="150" cy="74" r="11" fill="{G}"/><circle cx="150" cy="75" r="6" fill="{K}"/><circle cx="153" cy="71" r="2.2" fill="#fff"/>'
        ondas=f'<path d="M180 58 C186 50, 188 40, 186 30" fill="none" stroke="url(#w{uid})" stroke-width="6.5" stroke-linecap="round"/><path d="M192 70 C200 58, 202 44, 198 28" fill="none" stroke="url(#w{uid})" stroke-width="6.5" stroke-linecap="round" opacity="0.6"/>'
    return f'''<svg viewBox="0 0 200 200" width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bori" style="display:block">
<defs>
<linearGradient id="b{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C}"/><stop offset="1" stop-color="{C2}"/></linearGradient>
<linearGradient id="h{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{V2}"/><stop offset="0.55" stop-color="{V}"/><stop offset="1" stop-color="{V3}"/></linearGradient>
<linearGradient id="w{uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{V}"/><stop offset="1" stop-color="{V3}"/></linearGradient>
</defs>
{hoja_svg}
<path d="M64 114 C46 110, 30 118, 26 134" fill="none" stroke="{C3_}" stroke-width="15" stroke-linecap="round"/>
<path d="M26 134 C30 150, 44 160, 62 158" fill="none" stroke="{C2_}" stroke-width="12" stroke-linecap="round"/>
<path d="M62 158 C78 158, 92 152, 104 146" fill="none" stroke="{C2_}" stroke-width="9" stroke-linecap="round"/>
<circle cx="106" cy="145" r="6.5" fill="{CR_}"/><circle cx="96" cy="154" r="5" fill="{CR_}"/>
{saco}
<path d="M52 110 C44 88, 62 62, 96 56 C126 50, 156 56, 176 72 L186 78 C180 86, 168 96, 152 104 C128 116, 98 124, 74 122 C62 120, 56 116, 52 110 Z" {body}/>
{vientre}
{linea}
{ojo}
<path d="M134 110 C136 124, 142 134, 156 136" fill="none" stroke="{C2_}" stroke-width="10" stroke-linecap="round"/>
<circle cx="160" cy="136" r="6" fill="{CR_}"/><circle cx="152" cy="142" r="4.5" fill="{CR_}"/>
{ondas}
</svg>'''
