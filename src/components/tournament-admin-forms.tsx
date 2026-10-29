"use client";

import {
  generateBracketAction,
  setResultAction,
  type BracketState,
  type ResultState,
} from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import { MAX_SCORE, type Category } from "@/lib/tournaments";
import { Alert, Button } from "./ui";
import { useFormAction } from "./use-form-action";

export function GenerateBracketForm({ tournamentId, dict }: { tournamentId: string; dict: Dictionary }) {
  const a = dict.tournaments.admin;
  const [state, onSubmit, pending] = useFormAction<BracketState>(generateBracketAction, a.confirmGenerate);
  return (
    <form onSubmit={onSubmit} className="flex flex-col items-stretch gap-2 sm:items-end">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {a.generate}
      </Button>
      {state && !state.ok && <Alert>{a.errors[state.error]}</Alert>}
    </form>
  );
}

const field =
  "block w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs text-fg outline-none focus:border-navy-500";

export function MatchResultForm({
  tournamentId,
  category,
  match,
  current,
  dict,
}: {
  tournamentId: string;
  category: Category;
  match: { round: number; position: number; a: string; b: string };
  current: { winner: "a" | "b"; score: string } | null;
  dict: Dictionary;
}) {
  const a = dict.tournaments.admin;
  const [state, onSubmit, pending] = useFormAction<ResultState>(setResultAction);
  return (
    <form onSubmit={onSubmit} className="w-60 space-y-2 rounded-xl bg-bg-soft p-2.5">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="round" value={match.round} />
      <input type="hidden" name="position" value={match.position} />
      <div className="flex gap-2">
        <select name="winner" defaultValue={current?.winner ?? ""} required aria-label={a.winner} className={field}>
          <option value="" disabled>
            {a.winner}
          </option>
          <option value="a">{match.a}</option>
          <option value="b">{match.b}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input
          name="score"
          required
          maxLength={MAX_SCORE}
          defaultValue={current?.score}
          placeholder={a.scorePlaceholder}
          aria-label={a.score}
          className={field}
        />
        <Button type="submit" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" disabled={pending}>
          {a.save}
        </Button>
      </div>
      {state && !state.ok && <p className="text-xs text-red-600 dark:text-red-300">{a.errors[state.error]}</p>}
    </form>
  );
}
