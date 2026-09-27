import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { supabase } from '../utils/supabase'

const STORAGE_KEY = 'shiftSync_cycleTracker'
const SYMPTOMS = [
  'Mood swings',
  'Low energy / fatigue',
  'Cramps',
  'Bloating',
  'Headache',
  'Acne / skin changes'
]

function loadTrackerData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      periods: Array.isArray(saved.periods) ? saved.periods : [],
      cycleLength: Number.isInteger(saved.cycleLength) && saved.cycleLength >= 21 && saved.cycleLength <= 45
        ? saved.cycleLength
        : 28
    }
  } catch {
    return { periods: [], cycleLength: 28 }
  }
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`)
}

function CycleTracker({ session, authReady, onLogin, calendarMonth }) {
  const [trackerData, setTrackerData] = useState(loadTrackerData)
  const [cycleLengthDraft, setCycleLengthDraft] = useState(() => String(trackerData.cycleLength))
  const [startDate, setStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState(5)
  const [symptoms, setSymptoms] = useState([])
  const [notes, setNotes] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [isSavingPeriod, setIsSavingPeriod] = useState(false)
  const [saveConfirmed, setSaveConfirmed] = useState(false)
  const saveConfirmationTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData))
  }, [trackerData])

  useEffect(() => () => window.clearTimeout(saveConfirmationTimer.current), [])

  useEffect(() => {
    if (!session || !supabase) return undefined

    let active = true
    const loadCloudData = async () => {
      setSyncMessage('Loading your saved records…')
      const [periodResult, settingsResult] = await Promise.all([
        supabase.from('period_logs').select('start_date, duration, symptoms, notes').order('start_date'),
        supabase.from('cycle_settings').select('cycle_length').eq('user_id', session.user.id).maybeSingle()
      ])

      if (!active) return
      if (periodResult.error || settingsResult.error) {
        setSyncMessage(`Could not load cloud records: ${(periodResult.error || settingsResult.error).message}`)
        return
      }

      let cloudPeriods = periodResult.data || []
      const localData = loadTrackerData()
      if (cloudPeriods.length === 0 && localData.periods.length > 0) {
        const importedPeriods = localData.periods.map(period => ({
          user_id: session.user.id,
          start_date: period.startDate,
          duration: period.duration,
          symptoms: period.symptoms || [],
          notes: period.notes || ''
        }))
        const { data, error } = await supabase
          .from('period_logs')
          .upsert(importedPeriods, { onConflict: 'user_id,start_date' })
          .select('start_date, duration, symptoms, notes')

        if (!active) return
        if (error) {
          setSyncMessage(`Could not import this device's logs: ${error.message}`)
          return
        }
        cloudPeriods = data || importedPeriods.map(({ start_date, duration, symptoms, notes }) => ({ start_date, duration, symptoms, notes }))
      }

      const nextTrackerData = {
        periods: cloudPeriods.map(period => ({
          startDate: period.start_date,
          duration: period.duration,
          symptoms: period.symptoms || [],
          notes: period.notes || ''
        })),
        cycleLength: settingsResult.data?.cycle_length || localData.cycleLength
      }

      setTrackerData(nextTrackerData)
      if (!settingsResult.data) {
        const { error } = await supabase.from('cycle_settings').upsert({
          user_id: session.user.id,
          cycle_length: nextTrackerData.cycleLength
        })
        if (!active) return
        if (error) {
          setSyncMessage(`Logs loaded, but cycle settings did not sync: ${error.message}`)
          return
        }
      }

      setSyncMessage(cloudPeriods.length > 0 ? 'Your records are synced to this account.' : 'Cloud sync is ready for this account.')
    }

    let initialLoadStarted = false
    const startInitialLoad = () => {
      if (initialLoadStarted) return
      initialLoadStarted = true
      loadCloudData()
    }
    const channel = supabase
      .channel(`shift-sync-cycle-${session.user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'period_logs',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        if (payload.eventType === 'DELETE') {
          const startDate = payload.old?.start_date
          if (!startDate) return
          setTrackerData(current => ({
            ...current,
            periods: current.periods.filter(period => period.startDate !== startDate)
          }))
        } else if (payload.new?.start_date) {
          const period = {
            startDate: payload.new.start_date,
            duration: payload.new.duration,
            symptoms: payload.new.symptoms || [],
            notes: payload.new.notes || ''
          }
          setTrackerData(current => ({
            ...current,
            periods: [...current.periods.filter(item => item.startDate !== period.startDate), period]
          }))
        }
        setSyncMessage('Cycle records synced.')
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cycle_settings',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        const cycleLength = payload.new?.cycle_length
        if (!Number.isInteger(cycleLength)) return
        setTrackerData(current => ({ ...current, cycleLength }))
        setCycleLengthDraft(String(cycleLength))
        setSyncMessage('Cycle settings synced.')
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startInitialLoad()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncMessage('Live cycle sync disconnected. Changes remain saved locally.')
        }
      })

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [session])

  const periods = useMemo(() => [...trackerData.periods]
    .filter(period => period?.startDate && !Number.isNaN(dateFromKey(period.startDate).getTime()))
    .sort((left, right) => left.startDate.localeCompare(right.startDate)), [trackerData.periods])

  const cycleLength = useMemo(() => {
    const intervals = periods.slice(1).map((period, index) => (
      differenceInCalendarDays(dateFromKey(period.startDate), dateFromKey(periods[index].startDate))
    )).filter(days => days >= 15 && days <= 60)

    if (intervals.length === 0) return trackerData.cycleLength
    return Math.round(intervals.reduce((total, days) => total + days, 0) / intervals.length)
  }, [periods, trackerData.cycleLength])

  useEffect(() => {
    setCycleLengthDraft(String(cycleLength))
  }, [cycleLength])

  const today = startOfDay(new Date())
  const expectedStart = useMemo(() => {
    if (periods.length > 0) {
      return addDays(dateFromKey(periods[periods.length - 1].startDate), cycleLength)
    }

    let fallback = new Date(today.getFullYear(), today.getMonth(), 15)
    if (today.getDate() > 16) {
      fallback = new Date(today.getFullYear(), today.getMonth() + 1, 15)
    }
    return fallback
  }, [cycleLength, periods, today])

  const daysUntilExpected = differenceInCalendarDays(expectedStart, today)
  const predictionDates = useMemo(() => Array.from({ length: duration }, (_, index) => (
    format(addDays(expectedStart, index), 'yyyy-MM-dd')
  )), [duration, expectedStart])
  const loggedDates = useMemo(() => {
    const dates = new Set()
    periods.forEach(period => {
      const periodStart = dateFromKey(period.startDate)
      const periodDuration = Math.min(10, Math.max(2, Number(period.duration) || 5))
      for (let day = 0; day < periodDuration; day++) {
        dates.add(format(addDays(periodStart, day), 'yyyy-MM-dd'))
      }
    })
    return dates
  }, [periods])

  const calendarDays = useMemo(() => eachDayOfInterval({
    start: startOfMonth(calendarMonth),
    end: endOfMonth(calendarMonth)
  }), [calendarMonth])
  const monthOffset = getDay(startOfMonth(calendarMonth))
  const selectedPeriod = periods.find(period => period.startDate === startDate)
  const selectedDateIsLogged = periods.some(period => period.startDate === startDate)
  const selectedMonthIsLogged = periods.some(period => period.startDate.slice(0, 7) === startDate.slice(0, 7))
  const isDuplicateMonthlyLog = selectedMonthIsLogged && !selectedDateIsLogged
  const calendarMonthKey = format(calendarMonth, 'yyyy-MM')
  const calendarMonthIsLogged = periods.some(period => period.startDate.slice(0, 7) === calendarMonthKey)

  const reminder = daysUntilExpected >= 0 && daysUntilExpected <= 3
    ? daysUntilExpected === 0
      ? 'Your period may start today. Prepare essentials.'
      : `Expected in ${daysUntilExpected} day${daysUntilExpected === 1 ? '' : 's'}. Prepare essentials.`
    : daysUntilExpected < 0 && daysUntilExpected >= -2
      ? 'Your period may be starting around now. Take care of yourself.'
      : null

  const handleSelectDate = dateKey => {
    setStartDate(dateKey)
    const existing = periods.find(period => period.startDate === dateKey)
    setDuration(existing?.duration || 5)
    setSymptoms(existing?.symptoms || [])
    setNotes(existing?.notes || '')
  }

  const handleSavePeriod = async () => {
    if (!startDate || dateFromKey(startDate) > today) return
    if (isDuplicateMonthlyLog || isSavingPeriod) {
      setSyncMessage('One period start can be logged per month. Select this month’s existing log to update it.')
      return
    }

    const period = {
      startDate,
      duration: Math.min(10, Math.max(2, Number(duration) || 5)),
      symptoms,
      notes: notes.trim()
    }
    setTrackerData(current => ({
      ...current,
      periods: [...current.periods.filter(item => item.startDate !== startDate), period]
    }))

    const confirmSave = () => {
      window.clearTimeout(saveConfirmationTimer.current)
      setSaveConfirmed(false)
      window.requestAnimationFrame(() => setSaveConfirmed(true))
      saveConfirmationTimer.current = window.setTimeout(() => setSaveConfirmed(false), 1100)
    }

    if (session && supabase) {
      setIsSavingPeriod(true)
      setSyncMessage('Saving your period log…')
      try {
        const { error } = await supabase.from('period_logs').upsert({
          user_id: session.user.id,
          start_date: period.startDate,
          duration: period.duration,
          symptoms: period.symptoms,
          notes: period.notes
        }, { onConflict: 'user_id,start_date' })

        if (error?.code === '23505') {
          setTrackerData(current => ({
            ...current,
            periods: current.periods.filter(item => item.startDate !== period.startDate)
          }))
          setSyncMessage('A period is already logged for this month on another device. Select its existing log to update it.')
        } else if (error) {
          setSyncMessage(`Saved on this device; cloud sync failed: ${error.message}`)
          confirmSave()
        } else {
          setSyncMessage('Saved and synced to your account.')
          confirmSave()
        }
      } catch (error) {
        setSyncMessage(`Saved on this device; cloud sync failed: ${error.message}`)
        confirmSave()
      } finally {
        setIsSavingPeriod(false)
      }
    } else {
      setSyncMessage('Saved on this device. Sign in to sync across devices.')
      confirmSave()
    }
  }

  const handleDeletePeriod = async dateKey => {
    setTrackerData(current => ({
      ...current,
      periods: current.periods.filter(period => period.startDate !== dateKey)
    }))
    if (startDate === dateKey) {
      setSymptoms([])
      setNotes('')
      setDuration(5)
    }

    if (session && supabase) {
      const { error } = await supabase.from('period_logs').delete().eq('start_date', dateKey)
      setSyncMessage(error ? `Removed on this device; cloud delete failed: ${error.message}` : 'Period log deleted from your account.')
    }
  }

  const handleCycleLengthChange = async () => {
    const value = Number(cycleLengthDraft)
    if (value < 21 || value > 45) {
      setCycleLengthDraft(String(cycleLength))
      return
    }

    setTrackerData(current => ({ ...current, cycleLength: value }))
    if (!session || !supabase) return

    setSyncMessage('Cycle length saved on this device · syncing…')
    const { error } = await supabase.from('cycle_settings').upsert({
      user_id: session.user.id,
      cycle_length: value
    })
    setSyncMessage(error ? `Cycle length saved locally; cloud sync failed: ${error.message}` : 'Cycle length synced to your account.')
  }

  if (!authReady) {
    return (
      <section className="cycle-access-gate" aria-label="Cycle Tracker access">
        <p role="status">Checking your shared account…</p>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="cycle-access-gate" aria-labelledby="cycle-access-title">
        <div className="cycle-gate-copy">
          <span className="cycle-gate-mark" aria-hidden="true">🌸</span>
          <p className="cycle-eyebrow">PRIVATE CYCLE TRACKER</p>
          <h2 id="cycle-access-title">Cycle care, made personal.</h2>
          <p className="cycle-gate-description">
            Sign in with a valid shared account to access period history, personal notes, predictions, and wellness reminders.
          </p>
          <button className="cycle-gate-login" type="button" onClick={onLogin}>
            <span aria-hidden="true">🔐</span>
            <span>Sign in to access Cycle Tracker</span>
            <span aria-hidden="true">→</span>
          </button>
          <p className="cycle-gate-privacy">Only available while signed in. Your cycle details stay with the shared account.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="cycle-tracker" aria-labelledby="cycle-tracker-title">
      <div className="cycle-tracker-inner">
        <header className="cycle-heading">
          <div>
            <p className="cycle-eyebrow">Your personal cycle journal</p>
            <h2 id="cycle-tracker-title">Cycle Tracker</h2>
            <p className="cycle-intro">A gentle way to notice patterns and plan ahead.</p>
          </div>
          <div className="cycle-length-control">
            <label htmlFor="cycle-length">Cycle length</label>
            <div>
              <input
                id="cycle-length"
                type="number"
                min="21"
                max="45"
                value={cycleLengthDraft}
                disabled={periods.length > 1}
                onChange={event => setCycleLengthDraft(event.target.value)}
                onBlur={handleCycleLengthChange}
                onKeyDown={event => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                aria-describedby="cycle-length-help"
              />
              <span>days</span>
            </div>
            <span id="cycle-length-help" className="cycle-length-help">
              {periods.length > 1 ? 'Average of your logged cycles' : 'Adjust to match your usual cycle'}
            </span>
          </div>
        </header>

        <section className="cycle-account-panel" aria-label="Cycle tracker account">
          {session ? (
            <div className="cycle-account-signed-in">
              <div>
                <strong>Cloud sync on</strong>
                <span>Snehaa 🌻</span>
              </div>
            </div>
          ) : (
            <p role="status">Sign in from the header to sync cycle entries between devices.</p>
          )}
          {syncMessage && <p className="cycle-sync-message" role="status">{syncMessage}</p>}
        </section>

        {reminder && (
          <aside className="cycle-reminder" role="status">
            <span aria-hidden="true">🌷</span>
            <div>
              <strong>{reminder}</strong>
              <span>Predictions are estimates and can vary from cycle to cycle.</span>
            </div>
          </aside>
        )}

        <div className="cycle-layout">
          <section className="cycle-calendar-panel" aria-label="Cycle calendar">
            <div className="cycle-calendar-heading">
              <div>
                <h3>{format(calendarMonth, 'MMMM yyyy')}</h3>
                <p>{periods.length ? `Next expected ${format(expectedStart, 'MMM d')}` : 'Typical start window: 14th–16th'}</p>
              </div>
            </div>

            <div className="cycle-calendar-grid" role="grid" aria-label={format(calendarMonth, 'MMMM yyyy')}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <span className="cycle-weekday" key={`${day}-${index}`} role="columnheader">{day}</span>
              ))}
              {Array.from({ length: monthOffset }, (_, index) => (
                <span className="cycle-empty-day" key={`empty-${index}`} aria-hidden="true" />
              ))}
              {calendarDays.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const isPeriod = loggedDates.has(key)
                const isPredicted = predictionDates.includes(key) && !isPeriod
                const isToday = isSameDay(day, today)
                const isSelected = key === startDate
                const isLoggedStart = periods.some(period => period.startDate === key)
                const isBlockedByMonthlyLimit = calendarMonthIsLogged && !isLoggedStart
                const label = `${format(day, 'MMMM d')}${isPeriod ? ', logged period' : ''}${isPredicted ? ', predicted period' : ''}${isToday ? ', today' : ''}${isBlockedByMonthlyLimit ? ', a period is already logged this month' : ''}`

                return (
                  <button
                    type="button"
                    key={key}
                    role="gridcell"
                    aria-label={label}
                    aria-pressed={isSelected}
                    disabled={isBlockedByMonthlyLimit}
                    onClick={() => handleSelectDate(key)}
                    className={`cycle-day${isPeriod ? ' logged' : ''}${isPredicted ? ' predicted' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            <div className="cycle-calendar-legend" aria-label="Calendar legend">
              <span><i className="legend-period" />Logged</span>
              <span><i className="legend-predicted" />Predicted</span>
              <span><i className="legend-today" />Today</span>
            </div>

            <div className="cycle-forecast">
              <span className="cycle-forecast-icon" aria-hidden="true">✿</span>
              <div>
                <span className="cycle-forecast-label">NEXT EXPECTED</span>
                <strong>{format(expectedStart, 'MMMM d')}</strong>
                <span>{periods.length > 1 ? `Based on a ${cycleLength}-day average` : periods.length === 1 ? `Based on your ${cycleLength}-day cycle setting` : 'Estimate until you log a period'}</span>
              </div>
            </div>
          </section>

          <section className="cycle-log-panel" aria-labelledby="log-period-title">
            <div className="cycle-panel-heading">
              <div>
                <span className="cycle-step">01 / LOG</span>
                <h3 id="log-period-title">Period details</h3>
              </div>
              <span aria-hidden="true">📝</span>
            </div>

            <label className="cycle-field-label" htmlFor="period-start">Start date</label>
            <input
              className="cycle-date-input"
              id="period-start"
              type="date"
              max={format(today, 'yyyy-MM-dd')}
              value={startDate}
              onChange={event => handleSelectDate(event.target.value)}
            />
            <p className="cycle-period-limit-note">Only one period start can be logged per month.</p>
            {isDuplicateMonthlyLog && (
              <p className="cycle-month-limit" role="status">
                One period start per month. Select this month’s existing log to update it.
              </p>
            )}

            <label className="cycle-field-label" htmlFor="period-duration">Period duration</label>
            <div className="cycle-duration-control">
              <input
                id="period-duration"
                type="number"
                min="2"
                max="10"
                value={duration}
                onChange={event => setDuration(event.target.value)}
              />
              <span>days</span>
            </div>

            <fieldset className="cycle-symptoms">
              <legend>Symptoms <span>optional</span></legend>
              <div className="cycle-symptom-grid">
                {SYMPTOMS.map(symptom => (
                  <label key={symptom}>
                    <input
                      type="checkbox"
                      checked={symptoms.includes(symptom)}
                      onChange={event => setSymptoms(current => event.target.checked
                        ? [...current, symptom]
                        : current.filter(item => item !== symptom))}
                    />
                    <span>{symptom}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="cycle-field-label" htmlFor="cycle-notes">Personal notes <span>optional</span></label>
            <textarea
              id="cycle-notes"
              rows="2"
              maxLength="400"
              placeholder="Anything you want to remember…"
              value={notes}
              onChange={event => setNotes(event.target.value)}
            />

            <button
              className={`cycle-save-button${isSavingPeriod ? ' is-saving' : ''}${saveConfirmed ? ' is-saved' : ''}`}
              type="button"
              onClick={handleSavePeriod}
              disabled={isSavingPeriod || isDuplicateMonthlyLog}
            >
              {isSavingPeriod ? 'Saving…' : saveConfirmed ? 'Saved ✓' : isDuplicateMonthlyLog ? 'Already logged this month' : selectedPeriod ? 'Update period log' : 'Save period log'}
            </button>
            <p className="cycle-privacy-note">{session ? 'Your cycle details sync securely to your account.' : 'Your cycle details stay on this device until you sign in.'}</p>
          </section>
        </div>

        {periods.length > 0 && (
          <section className="cycle-history" aria-labelledby="cycle-history-title">
            <div className="cycle-history-heading">
              <div>
                <span className="cycle-step">YOUR RECORDS</span>
                <h3 id="cycle-history-title">Recent periods</h3>
              </div>
              <span>{periods.length} logged</span>
            </div>
            <div className="cycle-history-list">
              {[...periods].reverse().slice(0, 4).map(period => (
                <div className="cycle-history-row" key={period.startDate}>
                  <button type="button" onClick={() => handleSelectDate(period.startDate)}>
                    <strong>{format(dateFromKey(period.startDate), 'MMM d, yyyy')}</strong>
                    <span>{period.duration} days{period.symptoms?.length ? ` · ${period.symptoms.length} symptoms noted` : ''}</span>
                  </button>
                  <button type="button" className="cycle-delete-button" onClick={() => handleDeletePeriod(period.startDate)} aria-label={`Delete period starting ${format(dateFromKey(period.startDate), 'MMMM d, yyyy')}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="cycle-care" aria-labelledby="cycle-care-title">
          <div className="cycle-care-heading">
            <div>
              <span className="cycle-step">A LITTLE CARE</span>
              <h3 id="cycle-care-title">Wellness reminders</h3>
            </div>
            <p>Small comforts, at your pace.</p>
          </div>
          <div className="cycle-care-list">
            <div><span aria-hidden="true">💧</span><p><strong>Stay hydrated</strong><span>Keep water nearby and sip through the day.</span></p></div>
            <div><span aria-hidden="true">😴</span><p><strong>Make room for rest</strong><span>A calm evening and regular sleep can help you recharge.</span></p></div>
            <div><span aria-hidden="true">🧘</span><p><strong>Move gently</strong><span>Try a light walk or easy stretching if it feels good.</span></p></div>
            <div><span aria-hidden="true">🍎</span><p><strong>Nourish yourself</strong><span>Choose iron-rich foods and balanced meals; go easy on junk food.</span></p></div>
          </div>
          <p className="cycle-disclaimer">Cycle patterns vary. This tracker offers general wellness information, not medical advice.</p>
        </section>
      </div>
    </section>
  )
}

export default CycleTracker