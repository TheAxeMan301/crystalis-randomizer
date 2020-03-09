import { Token } from './token.js';
const DEBUG = false;
export class Define {
    constructor(overloads) {
        this.overloads = overloads;
    }
    canOverload() {
        return this.overloads[this.overloads.length - 1].canOverload();
    }
    append(define) {
        if (!this.canOverload()) {
            const prevDef = this.overloads[this.overloads.length - 1].definition;
            const at = prevDef ? Token.at(prevDef) : '';
            const prev = at.replace(/at/, 'previously defined at');
            const nextDef = define.overloads[0].definition;
            const next = nextDef ? Token.nameAt(nextDef) : '';
            throw new Error(`Non-overloadable: ${next}${prev}`);
        }
        this.overloads.push(...define.overloads);
    }
    expand(tokens, start) {
        const reasons = [];
        for (const overload of this.overloads) {
            const result = overload.expand(tokens, start);
            if (Array.isArray(result))
                return result;
            reasons.push(result);
        }
        if (DEBUG)
            console.error(reasons.join('\n'));
        return undefined;
    }
    static from(macro) {
        var _a;
        if (!Token.eq(macro[0], Token.DEFINE))
            throw new Error(`invalid`);
        if (((_a = macro[1]) === null || _a === void 0 ? void 0 : _a.token) !== 'ident')
            throw new Error(`invalid`);
        const paramStart = macro[2];
        let overload;
        if (!paramStart) {
            overload = new TexStyleDefine([], [], macro[1]);
        }
        else if (paramStart.token === 'grp') {
            overload = new TexStyleDefine(paramStart.inner, macro.slice(3), macro[1]);
        }
        else if (paramStart.token === 'lp') {
            const paramEnd = Token.findBalanced(macro, 2);
            if (paramEnd < 0) {
                throw new Error(`Expected close paren ${Token.nameAt(macro[2])}`);
            }
            overload =
                new CStyleDefine(Token.identsFromCList(macro.slice(3, paramEnd)), macro.slice(paramEnd + 1), macro[1]);
        }
        else {
            overload = new TexStyleDefine([], macro.slice(2), macro[1]);
        }
        return new Define([overload]);
    }
}
function produce(tokens, start, end, replacements, production) {
    const splice = [];
    let overflow = [];
    let line = splice;
    for (const tok of production) {
        if (tok.token === 'ident') {
            const param = replacements.get(tok.str);
            if (param) {
                line.push(...param);
                continue;
            }
        }
        else if (Token.eq(tok, Token.DOT_EOL)) {
            overflow.push(line = []);
            continue;
        }
        const source = tok.source && tokens[0].source ?
            { ...tok.source, parent: tokens[0].source } :
            tok.source || tokens[0].source;
        line.push(source ? { ...tok, source } : tok);
    }
    overflow = overflow.filter(l => l.length);
    if (overflow.length && end < tokens.length) {
        return 'cannot expand .eol without consuming to end of line';
    }
    tokens.splice(start, end - start, ...splice);
    return overflow;
}
class CStyleDefine {
    constructor(params, production, definition) {
        this.params = params;
        this.production = production;
        this.definition = definition;
    }
    expand(tokens, start) {
        let i = start + 1;
        let splice = this.params.length ? tokens.length : start;
        let end = splice;
        const replacements = new Map();
        if (start < tokens.length && Token.eq(Token.LP, tokens[i])) {
            end = Token.findBalanced(tokens, i);
            if (end < 0) {
                return 'missing close paren for enclosed C-style expansion';
            }
            splice = end + 1;
            i++;
        }
        const args = Token.parseArgList(tokens, i, end);
        if (args.length > this.params.length) {
            return 'too many args';
        }
        for (i = 0; i < this.params.length; i++) {
            let arg = args[i] || [];
            const front = arg[0];
            if (arg.length === 1 && front.token === 'grp') {
                arg = front.inner;
            }
            replacements.set(this.params[i], arg);
        }
        return produce(tokens, start, splice, replacements, this.production);
    }
    canOverload() { return Boolean(this.params.length); }
}
class TexStyleDefine {
    constructor(pattern, production, definition) {
        this.pattern = pattern;
        this.production = production;
        this.definition = definition;
    }
    expand(tokens, start) {
        var _a;
        let i = start + 1;
        const replacements = new Map();
        for (let patPos = 0; patPos < this.pattern.length; patPos++) {
            const pat = this.pattern[patPos];
            if (pat.token === 'ident') {
                const delim = this.pattern[patPos + 1];
                if (!delim || ((_a = delim) === null || _a === void 0 ? void 0 : _a.token) === 'ident') {
                    const tok = tokens[i++];
                    if (!tok)
                        return `missing undelimited argument ${Token.name(pat)}`;
                    replacements.set(pat.str, tok.token === 'grp' ? tok.inner : [tok]);
                }
                else {
                    const end = Token.eq(delim, Token.DOT_EOL) ?
                        tokens.length : Token.find(tokens, delim, i);
                    if (end < 0)
                        return `could not find delimiter ${Token.name(delim)}`;
                    replacements.set(pat.str, tokens.slice(i, end));
                    i = end;
                }
            }
            else if (Token.eq(pat, Token.DOT_EOL)) {
                if (i < tokens.length)
                    return `could not match .eol`;
            }
            else {
                if (!Token.eq(tokens[i++], pat)) {
                    return `could not match: ${Token.name(pat)}`;
                }
            }
        }
        return produce(tokens, start, i, replacements, this.production);
    }
    canOverload() { return Boolean(this.pattern.length); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL2FzbS9kZWZpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7QUFFcEIsTUFBTSxPQUFPLE1BQU07SUFDakIsWUFBcUMsU0FBMkI7UUFBM0IsY0FBUyxHQUFULFNBQVMsQ0FBa0I7SUFBRyxDQUFDO0lBU3BFLFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDakUsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFjO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDckUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUN2RCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztZQUMvQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixJQUFJLEdBQUcs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LEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxDQUFDLEdBQUcsR0FBRyxDQUFDO2lCQUNUO2FBQ0Y7aUJBQU0sSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNO29CQUFFLE9BQU8sc0JBQXNCLENBQUM7YUFDdEQ7aUJBQU07Z0JBRUwsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQy9CLE9BQU8sb0JBQW9CLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztpQkFDOUM7YUFDRjtTQUNGO1FBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsV0FBVyxLQUFLLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUb2tlbn0gZnJvbSAnLi90b2tlbi5qcyc7XG5cbmNvbnN0IERFQlVHID0gZmFsc2U7XG5cbmV4cG9ydCBjbGFzcyBEZWZpbmUge1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgb3ZlcmxvYWRzOiBEZWZpbmVPdmVybG9hZFtdKSB7fVxuXG4gIC8vIG92ZXJyaWRlKG1hY3JvOiBNYWNyb0V4cGFuc2lvbik6IE1hY3JvRXhwYW5zaW9uIHtcbiAgLy8gICBpZiAobWFjcm8gaW5zdGFuY2VvZiBEZWZpbmUpIHtcbiAgLy8gICAgIHJldHVybiBuZXcgRGVmaW5lKFsuLi50aGlzLm92ZXJsb2FkcywgLi4ubWFjcm8ub3ZlcmxvYWRzXSk7XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiBtYWNybztcbiAgLy8gfVxuXG4gIGNhbk92ZXJsb2FkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm92ZXJsb2Fkc1t0aGlzLm92ZXJsb2Fkcy5sZW5ndGggLSAxXS5jYW5PdmVybG9hZCgpO1xuICB9XG5cbiAgYXBwZW5kKGRlZmluZTogRGVmaW5lKSB7XG4gICAgaWYgKCF0aGlzLmNhbk92ZXJsb2FkKCkpIHtcbiAgICAgIGNvbnN0IHByZXZEZWYgPSB0aGlzLm92ZXJsb2Fkc1t0aGlzLm92ZXJsb2Fkcy5sZW5ndGggLSAxXS5kZWZpbml0aW9uO1xuICAgICAgY29uc3QgYXQgPSBwcmV2RGVmID8gVG9rZW4uYXQocHJldkRlZikgOiAnJztcbiAgICAgIGNvbnN0IHByZXYgPSBhdC5yZXBsYWNlKC9hdC8sICdwcmV2aW91c2x5IGRlZmluZWQgYXQnKTtcbiAgICAgIGNvbnN0IG5leHREZWYgPSBkZWZpbmUub3ZlcmxvYWRzWzBdLmRlZmluaXRpb247XG4gICAgICBjb25zdCBuZXh0ID0gbmV4dERlZiA/IFRva2VuLm5hbWVBdChuZXh0RGVmKSA6ICcnO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb24tb3ZlcmxvYWRhYmxlOiAke25leHR9JHtwcmV2fWApO1xuICAgIH1cbiAgICB0aGlzLm92ZXJsb2Fkcy5wdXNoKC4uLmRlZmluZS5vdmVybG9hZHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgaW4gcGxhY2UsIHBvc3NpYmx5IGluIHRoZSBtaWRkbGUgb2YgYSBsaW5lISAgUmV0dXJucyB0cnVlXG4gICAqIGlmIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UgcmV0dXJuIGZhbHNlIGFuZCBkbyBub3RoaW5nLlxuICAgKi9cbiAgZXhwYW5kKHRva2VuczogVG9rZW5bXSwgc3RhcnQ6IG51bWJlcik6IFRva2VuW11bXXx1bmRlZmluZWQge1xuICAgIGNvbnN0IHJlYXNvbnMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IG92ZXJsb2FkIG9mIHRoaXMub3ZlcmxvYWRzKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBvdmVybG9hZC5leHBhbmQodG9rZW5zLCBzdGFydCk7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmVhc29ucy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChERUJVRykgY29uc29sZS5lcnJvcihyZWFzb25zLmpvaW4oJ1xcbicpKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gTk9URTogbWFjcm9bMF0gaXMgLmRlZmluZVxuICBzdGF0aWMgZnJvbShtYWNybzogVG9rZW5bXSkge1xuICAgIGlmICghVG9rZW4uZXEobWFjcm9bMF0sIFRva2VuLkRFRklORSkpIHRocm93IG5ldyBFcnJvcihgaW52YWxpZGApO1xuICAgIGlmIChtYWNyb1sxXT8udG9rZW4gIT09ICdpZGVudCcpIHRocm93IG5ldyBFcnJvcihgaW52YWxpZGApO1xuICAgIC8vIHBhcnNlIHRoZSBwYXJhbWV0ZXIgbGlzdCwgaWYgYW55XG4gICAgY29uc3QgcGFyYW1TdGFydCA9IG1hY3JvWzJdO1xuICAgIGxldCBvdmVybG9hZDogRGVmaW5lT3ZlcmxvYWQ7XG4gICAgaWYgKCFwYXJhbVN0YXJ0KSB7XG4gICAgICAvLyBibGFuayBtYWNyb1xuICAgICAgb3ZlcmxvYWQgPSBuZXcgVGV4U3R5bGVEZWZpbmUoW10sIFtdLCBtYWNyb1sxXSk7XG4gICAgfSBlbHNlIGlmIChwYXJhbVN0YXJ0LnRva2VuID09PSAnZ3JwJykge1xuICAgICAgLy8gVGVYLXN0eWxlIHBhcmFtIGxpc3RcbiAgICAgIG92ZXJsb2FkID0gbmV3IFRleFN0eWxlRGVmaW5lKHBhcmFtU3RhcnQuaW5uZXIsIG1hY3JvLnNsaWNlKDMpLCBtYWNyb1sxXSk7XG4gICAgfSBlbHNlIGlmIChwYXJhbVN0YXJ0LnRva2VuID09PSAnbHAnKSB7XG4gICAgICAvLyBDLXN0eWxlIHBhcmFtIGxpc3RcbiAgICAgIGNvbnN0IHBhcmFtRW5kID0gVG9rZW4uZmluZEJhbGFuY2VkKG1hY3JvLCAyKTtcbiAgICAgIGlmIChwYXJhbUVuZCA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBjbG9zZSBwYXJlbiAke1Rva2VuLm5hbWVBdChtYWNyb1syXSl9YCk7XG4gICAgICB9XG4gICAgICBvdmVybG9hZCA9XG4gICAgICAgICAgbmV3IENTdHlsZURlZmluZShUb2tlbi5pZGVudHNGcm9tQ0xpc3QobWFjcm8uc2xpY2UoMywgcGFyYW1FbmQpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hY3JvLnNsaWNlKHBhcmFtRW5kICsgMSksIG1hY3JvWzFdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm8gcGFyYW0gbGlzdFxuICAgICAgb3ZlcmxvYWQgPSBuZXcgVGV4U3R5bGVEZWZpbmUoW10sIG1hY3JvLnNsaWNlKDIpLCBtYWNyb1sxXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGVmaW5lKFtvdmVybG9hZF0pO1xuICB9XG59XG5cbmludGVyZmFjZSBEZWZpbmVPdmVybG9hZCB7XG4gIHJlYWRvbmx5IGRlZmluaXRpb24/OiBUb2tlbjtcbiAgZXhwYW5kKHRva2VuczogVG9rZW5bXSwgc3RhcnQ6IG51bWJlcik6IHN0cmluZ3xUb2tlbltdW107XG4gIGNhbk92ZXJsb2FkKCk6IGJvb2xlYW47XG59XG5cbmZ1bmN0aW9uIHByb2R1Y2UodG9rZW5zOiBUb2tlbltdLFxuICAgICAgICAgICAgICAgICBzdGFydDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICBlbmQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRzOiBNYXA8c3RyaW5nLCBUb2tlbltdPixcbiAgICAgICAgICAgICAgICAgcHJvZHVjdGlvbjogVG9rZW5bXSk6IHN0cmluZ3xUb2tlbltdW10ge1xuICBjb25zdCBzcGxpY2U6IFRva2VuW10gPSBbXTtcbiAgbGV0IG92ZXJmbG93OiBUb2tlbltdW10gPSBbXTtcbiAgbGV0IGxpbmUgPSBzcGxpY2U7XG4gIGZvciAoY29uc3QgdG9rIG9mIHByb2R1Y3Rpb24pIHtcbiAgICBpZiAodG9rLnRva2VuID09PSAnaWRlbnQnKSB7XG4gICAgICBjb25zdCBwYXJhbSA9IHJlcGxhY2VtZW50cy5nZXQodG9rLnN0cik7XG4gICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgLy8gdGhpcyBpcyBhY3R1YWxseSBhIHBhcmFtZXRlclxuICAgICAgICBsaW5lLnB1c2goLi4ucGFyYW0pOyAvLyBUT0RPIC0gY29weSB3LyBjaGlsZCBzb3VyY2VpbmZvP1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFRva2VuLmVxKHRvaywgVG9rZW4uRE9UX0VPTCkpIHtcbiAgICAgIG92ZXJmbG93LnB1c2gobGluZSA9IFtdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBzb3VyY2UgPVxuICAgICAgICB0b2suc291cmNlICYmIHRva2Vuc1swXS5zb3VyY2UgP1xuICAgICAgICAgICAgey4uLnRvay5zb3VyY2UsIHBhcmVudDogdG9rZW5zWzBdLnNvdXJjZX0gOlxuICAgICAgICAgICAgdG9rLnNvdXJjZSB8fCB0b2tlbnNbMF0uc291cmNlO1xuICAgIGxpbmUucHVzaChzb3VyY2UgPyB7Li4udG9rLCBzb3VyY2V9IDogdG9rKTtcbiAgfVxuICBvdmVyZmxvdyA9IG92ZXJmbG93LmZpbHRlcihsID0+IGwubGVuZ3RoKTtcbiAgaWYgKG92ZXJmbG93Lmxlbmd0aCAmJiBlbmQgPCB0b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICdjYW5ub3QgZXhwYW5kIC5lb2wgd2l0aG91dCBjb25zdW1pbmcgdG8gZW5kIG9mIGxpbmUnO1xuICB9XG4gIHRva2Vucy5zcGxpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0LCAuLi5zcGxpY2UpO1xuICByZXR1cm4gb3ZlcmZsb3c7XG59XG5cbmNsYXNzIENTdHlsZURlZmluZSBpbXBsZW1lbnRzIERlZmluZU92ZXJsb2FkIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcGFyYW1zOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgcmVhZG9ubHkgcHJvZHVjdGlvbjogVG9rZW5bXSxcbiAgICAgICAgICAgICAgcmVhZG9ubHkgZGVmaW5pdGlvbj86IFRva2VuKSB7fVxuXG4gIGV4cGFuZCh0b2tlbnM6IFRva2VuW10sIHN0YXJ0OiBudW1iZXIpOiBzdHJpbmd8VG9rZW5bXVtdIHtcbiAgICBsZXQgaSA9IHN0YXJ0ICsgMTsgLy8gc2tpcCBwYXN0IHRoZSBtYWNybyBjYWxsIGlkZW50aWZpZXJcbiAgICBsZXQgc3BsaWNlID0gdGhpcy5wYXJhbXMubGVuZ3RoID8gdG9rZW5zLmxlbmd0aCA6IHN0YXJ0O1xuICAgIGxldCBlbmQgPSBzcGxpY2U7XG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIFRva2VuW10+KCk7XG4gICAgXG4gICAgaWYgKHN0YXJ0IDwgdG9rZW5zLmxlbmd0aCAmJiBUb2tlbi5lcShUb2tlbi5MUCwgdG9rZW5zW2ldKSkge1xuICAgICAgZW5kID0gVG9rZW4uZmluZEJhbGFuY2VkKHRva2VucywgaSk7XG4gICAgICBpZiAoZW5kIDwgMCkge1xuICAgICAgICAvLyB0aHJvdz9cbiAgICAgICAgcmV0dXJuICdtaXNzaW5nIGNsb3NlIHBhcmVuIGZvciBlbmNsb3NlZCBDLXN0eWxlIGV4cGFuc2lvbic7XG4gICAgICB9XG4gICAgICBzcGxpY2UgPSBlbmQgKyAxO1xuICAgICAgaSsrO1xuICAgICAgLy90b2sgPSBuZXcgU2Nhbm5lcih0b2tlbnMuc2xpY2UoMCwgaSksIHN0YXJ0ICsgMSk7XG4gICAgfVxuICAgIC8vIEZpbmQgYSBjb21tYSwgc2tpcHBpbmcgYmFsYW5jZWQgcGFyZW5zLlxuICAgIGNvbnN0IGFyZ3MgPSBUb2tlbi5wYXJzZUFyZ0xpc3QodG9rZW5zLCBpLCBlbmQpO1xuICAgIGlmIChhcmdzLmxlbmd0aCA+IHRoaXMucGFyYW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuICd0b28gbWFueSBhcmdzJztcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5wYXJhbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBhcmcgPSBhcmdzW2ldIHx8IFtdO1xuICAgICAgY29uc3QgZnJvbnQgPSBhcmdbMF07XG4gICAgICBpZiAoYXJnLmxlbmd0aCA9PT0gMSAmJiBmcm9udC50b2tlbiA9PT0gJ2dycCcpIHtcbiAgICAgICAgYXJnID0gZnJvbnQuaW5uZXI7XG4gICAgICB9XG4gICAgICByZXBsYWNlbWVudHMuc2V0KHRoaXMucGFyYW1zW2ldLCBhcmcpO1xuICAgIH1cbiAgICAvLyBBbGwgcGFyYW1zIGZpbGxlZCBpbiwgbWFrZSByZXBsYWNlbWVudCBhbmQgZmlsbCBpdCBpbi5cbiAgICByZXR1cm4gcHJvZHVjZSh0b2tlbnMsIHN0YXJ0LCBzcGxpY2UsIHJlcGxhY2VtZW50cywgdGhpcy5wcm9kdWN0aW9uKTtcbiAgfVxuXG4gIGNhbk92ZXJsb2FkKCkgeyByZXR1cm4gQm9vbGVhbih0aGlzLnBhcmFtcy5sZW5ndGgpOyB9XG59XG5cbmNsYXNzIFRleFN0eWxlRGVmaW5lIGltcGxlbWVudHMgRGVmaW5lT3ZlcmxvYWQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBwYXR0ZXJuOiBUb2tlbltdLFxuICAgICAgICAgICAgICByZWFkb25seSBwcm9kdWN0aW9uOiBUb2tlbltdLFxuICAgICAgICAgICAgICByZWFkb25seSBkZWZpbml0aW9uPzogVG9rZW4pIHt9XG4gIGV4cGFuZCh0b2tlbnM6IFRva2VuW10sIHN0YXJ0OiBudW1iZXIpOiBzdHJpbmd8VG9rZW5bXVtdIHtcbiAgICBsZXQgaSA9IHN0YXJ0ICsgMTsgLy8gc2tpcCBwYXN0IHRoZSBtYWNybyBjYWxsIGlkZW50aWZpZXJcbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgVG9rZW5bXT4oKTtcbiAgICBmb3IgKGxldCBwYXRQb3MgPSAwOyBwYXRQb3MgPCB0aGlzLnBhdHRlcm4ubGVuZ3RoOyBwYXRQb3MrKykge1xuICAgICAgY29uc3QgcGF0ID0gdGhpcy5wYXR0ZXJuW3BhdFBvc107XG4gICAgICBpZiAocGF0LnRva2VuID09PSAnaWRlbnQnKSB7XG4gICAgICAgIGNvbnN0IGRlbGltID0gdGhpcy5wYXR0ZXJuW3BhdFBvcyArIDFdO1xuICAgICAgICBpZiAoIWRlbGltIHx8IGRlbGltPy50b2tlbiA9PT0gJ2lkZW50Jykge1xuICAgICAgICAgIC8vIHBhcnNlIHVuZGVsaW1pdGVkXG4gICAgICAgICAgY29uc3QgdG9rID0gdG9rZW5zW2krK107XG4gICAgICAgICAgaWYgKCF0b2spIHJldHVybiBgbWlzc2luZyB1bmRlbGltaXRlZCBhcmd1bWVudCAke1Rva2VuLm5hbWUocGF0KX1gO1xuICAgICAgICAgIHJlcGxhY2VtZW50cy5zZXQocGF0LnN0ciwgdG9rLnRva2VuID09PSAnZ3JwJyA/IHRvay5pbm5lciA6IFt0b2tdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBwYXJzZSBkZWxpbWl0ZWRcbiAgICAgICAgICBjb25zdCBlbmQgPSBUb2tlbi5lcShkZWxpbSwgVG9rZW4uRE9UX0VPTCkgP1xuICAgICAgICAgICAgICB0b2tlbnMubGVuZ3RoIDogVG9rZW4uZmluZCh0b2tlbnMsIGRlbGltLCBpKTtcbiAgICAgICAgICBpZiAoZW5kIDwgMCkgcmV0dXJuIGBjb3VsZCBub3QgZmluZCBkZWxpbWl0ZXIgJHtUb2tlbi5uYW1lKGRlbGltKX1gO1xuICAgICAgICAgIC8vcGF0UG9zKys7XG4gICAgICAgICAgcmVwbGFjZW1lbnRzLnNldChwYXQuc3RyLCB0b2tlbnMuc2xpY2UoaSwgZW5kKSk7XG4gICAgICAgICAgaSA9IGVuZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChUb2tlbi5lcShwYXQsIFRva2VuLkRPVF9FT0wpKSB7XG4gICAgICAgIGlmIChpIDwgdG9rZW5zLmxlbmd0aCkgcmV0dXJuIGBjb3VsZCBub3QgbWF0Y2ggLmVvbGA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB0b2tlbiB0byBtYXRjaFxuICAgICAgICBpZiAoIVRva2VuLmVxKHRva2Vuc1tpKytdLCBwYXQpKSB7XG4gICAgICAgICAgcmV0dXJuIGBjb3VsZCBub3QgbWF0Y2g6ICR7VG9rZW4ubmFtZShwYXQpfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gTm93IHNwbGljZSBpbiB0aGUgcHJvZHVjdGlvbiBhbmQgZmlsbCB0byBlbmQgb2YgbGluZSBcbiAgICByZXR1cm4gcHJvZHVjZSh0b2tlbnMsIHN0YXJ0LCBpLCByZXBsYWNlbWVudHMsIHRoaXMucHJvZHVjdGlvbik7XG4gIH1cblxuICBjYW5PdmVybG9hZCgpIHsgcmV0dXJuIEJvb2xlYW4odGhpcy5wYXR0ZXJuLmxlbmd0aCk7IH1cbn1cblxuXG4vLyBjYTY1IGJlaGF2aW9yXG4vLyAgLSBleHBhbmQgbWFjcm9zIGluIGFyZ3VtZW50cyBiZWZvcmUgc2VuZGluZyB0aGVtIGludG8gb3V0ZXIgbWFjcm9cbi8vICAtIGRvbid0IGV4cGFuZCBtYWNyb3MgaW4gcHJvZHVjdGlvblxuLy8gIC0gbmVzdGVkIGJyYWNlcyBnbyBhd2F5IGJlY2F1c2UgZXhwYW5zaW9uIGhhcHBlbnMgd2hpbGUgbG9va2luZyBmb3IgY2xvc2luZyBicmFjZVxuLy8gIC0gd2hlbiBzY2FubmluZyBmb3IgYXJndW1lbnRzLCBjb21tYSB0ZXJtaW5hdGVzLCBzb1xuLy8gICAgIEFBKGExLCBhMikgLT4gYTEsIGEyLCBhMSwgYTJcbi8vICAgICBBQSAxLCAyLCAzIC0tLT4gMSwgMiwgMSwgMiwgM1xuLy8gICAgYnV0XG4vLyAgICAgQUEgezEsIDJ9LCAzICBkb2Vzbid0IHNlZW0gdG8gZXhwYW5kIHRvICAxLCAyLCAzLCAxLCAyLCAzICA/Pz9cbi8vICAtIHNwYWNlIGJlZm9yZSBwYXJlbiBpbiBkZWZuIGRvZXNuJ3QgY2hhbmdlIGFueXRoaW5nXG5cblxuLy8gZnVuY3Rpb24gZmFpbCh0OiBUb2tlbiwgbXNnOiBzdHJpbmcpOiBuZXZlciB7XG4vLyAgIGxldCBzID0gdC5zb3VyY2U7XG4vLyAgIGlmIChzKSBtc2cgKz0gYFxcbiAgYXQgJHtzLmZpbGV9OiR7cy5saW5lfToke3MuY29sdW1ufTogJHtzLmNvbnRlbnR9YDtcbi8vICAgd2hpbGUgKHM/LnBhcmVudCkge1xuLy8gICAgIHMgPSBzLnBhcmVudDtcbi8vICAgICBtc2cgKz0gYFxcbiAgaW5jbHVkZWQgZnJvbSAke3MuZmlsZX06JHtzLmxpbmV9OiR7cy5jb2x1bW59OiAke3MuY29udGVudH1gO1xuLy8gICB9XG4vLyAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuLy8gfVxuIl19